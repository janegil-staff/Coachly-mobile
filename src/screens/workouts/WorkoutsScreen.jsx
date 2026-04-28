// src/screens/workouts/WorkoutsScreen.jsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Pressable,
  Modal,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { useTheme } from "../../context/ThemeContext";
import { useLang } from "../../context/LangContext";
import { getTranslatedCatalog } from "../../lib/exerciseCatalog";
import { exercisesApi } from "../../services/api";
import { FontSize, Spacing } from "../../constants/theme";

const CATEGORIES = [
  { key: "strength", labelKey: "categoryStrength" },
  { key: "cardio",   labelKey: "categoryCardio" },
  { key: "mobility", labelKey: "categoryMobility" },
  { key: "recovery", labelKey: "categoryRecovery" },
  { key: "other",    labelKey: "categoryOther" },
];

export default function WorkoutsScreen() {
  const { theme } = useTheme();
  const { t } = useLang();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const styles = getStyles(theme, insets);

  const [customExercises, setCustomExercises] = useState([]);
  const [selectedSlugs, setSelectedSlugs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);

  const catalog = useMemo(() => getTranslatedCatalog(t), [t]);

  const load = useCallback(async () => {
    try {
      const [list, slugs] = await Promise.all([
        exercisesApi.listCustom().catch(() => []),
        exercisesApi.getSelection().catch(() => []),
      ]);
      setCustomExercises(list);
      setSelectedSlugs(slugs);
    } catch (err) {
      console.warn("Failed to load exercises", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const allExercises = useMemo(() => {
    const catalogItems = catalog.map((c) => ({
      ...c,
      isSelected: selectedSlugs.includes(c.slug),
    }));
    const customItems = customExercises.map((e) => ({
      ...e,
      isCustom: true,
      isSelected: true,
    }));
    return [...catalogItems, ...customItems];
  }, [catalog, customExercises, selectedSlugs]);

  const filtered = useMemo(() => {
    let list = allExercises;
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((e) => e.name.toLowerCase().includes(q));
    }
    return list;
  }, [allExercises, search]);

  const { selectedList, browseList } = useMemo(() => {
    const sel = filtered.filter((e) => e.isSelected);
    const browse = filtered.filter((e) => !e.isSelected);
    return { selectedList: sel, browseList: browse };
  }, [filtered]);

  const groupedBrowse = useMemo(() => {
    const map = {};
    for (const e of browseList) (map[e.category] ||= []).push(e);
    return CATEGORIES.filter((c) => map[c.key]?.length).map(
      (c) => ({ ...c, items: map[c.key] })
    );
  }, [browseList]);

  const handleToggle = async (item) => {
    if (item.isCustom) return;
    const wasSelected = selectedSlugs.includes(item.slug);
    setSelectedSlugs((prev) =>
      wasSelected ? prev.filter((s) => s !== item.slug) : [...prev, item.slug]
    );
    try {
      const { selectedSlugs: serverSlugs } = await exercisesApi.toggleSelection(
        item.slug
      );
      setSelectedSlugs(serverSlugs);
    } catch (err) {
      setSelectedSlugs((prev) =>
        wasSelected ? [...prev, item.slug] : prev.filter((s) => s !== item.slug)
      );
      console.warn("Toggle failed:", err?.message);
    }
  };

  const handleAdd = async (name, category) => {
    try {
      const ex = await exercisesApi.createCustom({ name, category });
      if (ex) setCustomExercises((prev) => [...prev, ex]);
      setShowAdd(false);
    } catch (err) {
      Alert.alert(
        t.error ?? "Error",
        err?.message ?? t.exerciseCreateFailed ?? "Could not add exercise."
      );
    }
  };

  const handleDeleteCustom = (item) => {
    if (!item.isCustom) return;
    Alert.alert(
      t.deleteExercise ?? "Delete exercise",
      `${t.deleteExerciseConfirm ?? "Remove"} "${item.name}"?`,
      [
        { text: t.cancel ?? "Cancel", style: "cancel" },
        {
          text: t.delete ?? "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await exercisesApi.deleteCustom(item._id);
              setCustomExercises((prev) =>
                prev.filter((e) => e._id !== item._id)
              );
            } catch (err) {
              console.warn("Delete failed:", err?.message);
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* ── Header (matches Profile pattern) ── */}
      <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => navigation.goBack()}
          hitSlop={10}
        >
          <Text style={styles.headerBack}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {t.workouts ?? "Workouts"}
        </Text>
        <View style={styles.headerBtnRight} />
      </View>

      {loading ? (
        <View style={[styles.center, { flex: 1 }]}>
          <ActivityIndicator color={theme.accent} />
        </View>
      ) : (
        <>
          <View style={styles.searchBar}>
            <TextInput
              style={styles.searchInput}
              placeholder={t.searchExercises ?? "Search exercises…"}
              placeholderTextColor={theme.textMuted}
              value={search}
              onChangeText={setSearch}
              autoCorrect={false}
              autoCapitalize="none"
            />
            {search.length > 0 && (
              <TouchableOpacity onPress={() => setSearch("")} hitSlop={10}>
                <Text style={styles.clearBtn}>✕</Text>
              </TouchableOpacity>
            )}
          </View>

          <ScrollView
            contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
          >
            {selectedList.length > 0 && (
              <View style={{ marginBottom: 20 }}>
                <Text style={styles.sectionHeader}>
                  {t.myExercises ?? "My exercises"}{" "}
                  <Text style={styles.sectionCount}>
                    ({selectedList.length})
                  </Text>
                </Text>
                {selectedList.map((ex) => (
                  <ExerciseRow
                    key={ex._id}
                    ex={ex}
                    styles={styles}
                    t={t}
                    theme={theme}
                    onToggle={handleToggle}
                    onDeleteCustom={handleDeleteCustom}
                  />
                ))}
              </View>
            )}

            {browseList.length > 0 && (
              <View>
                <Text style={styles.sectionHeader}>
                  {selectedList.length > 0
                    ? (t.browseAll ?? "Browse all")
                    : (t.allExercises ?? "All exercises")}
                </Text>

                {groupedBrowse.map((group) => (
                  <View key={group.key} style={{ marginBottom: 8 }}>
                    <Text style={styles.groupHeader}>
                      {t[group.labelKey] ?? group.labelKey}
                    </Text>
                    {group.items.map((ex) => (
                      <ExerciseRow
                        key={ex._id}
                        ex={ex}
                        styles={styles}
                        t={t}
                        theme={theme}
                        onToggle={handleToggle}
                        onDeleteCustom={handleDeleteCustom}
                      />
                    ))}
                  </View>
                ))}
              </View>
            )}

            {selectedList.length === 0 && browseList.length === 0 && (
              <Text style={styles.emptyText}>
                {t.noExercisesFound ?? "No exercises found."}
              </Text>
            )}
          </ScrollView>

          <TouchableOpacity
            style={[styles.fab, { bottom: 20 + insets.bottom }]}
            onPress={() => setShowAdd(true)}
            activeOpacity={0.85}
          >
            <Text style={styles.fabText}>+ {t.addCustom ?? "Add custom"}</Text>
          </TouchableOpacity>
        </>
      )}

      <AddCustomModal
        visible={showAdd}
        onClose={() => setShowAdd(false)}
        onSave={handleAdd}
        styles={styles}
        theme={theme}
        t={t}
      />
    </View>
  );
}

function ExerciseRow({ ex, styles, t, theme, onToggle, onDeleteCustom }) {
  const isSelected = ex.isSelected;
  return (
    <Pressable
      onPress={() => onToggle(ex)}
      onLongPress={ex.isCustom ? () => onDeleteCustom(ex) : undefined}
      style={({ pressed }) => [
        styles.row,
        isSelected ? styles.rowSelected : styles.rowUnselected,
        pressed && styles.rowPressed,
      ]}
    >
      <View style={{ flex: 1 }}>
        <Text style={[styles.rowName, isSelected && { fontWeight: "600" }]}>
          {ex.name}
        </Text>
        {ex.isCustom && (
          <Text style={styles.rowBadge}>{t.customLabel ?? "Custom"}</Text>
        )}
      </View>

      {ex.isCustom && (
        <TouchableOpacity
          onPress={() => onDeleteCustom(ex)}
          hitSlop={10}
          style={{ paddingHorizontal: 8 }}
        >
          <Text style={styles.rowDelete}>✕</Text>
        </TouchableOpacity>
      )}

      <View
        style={[
          styles.checkbox,
          isSelected && {
            backgroundColor: theme.accent,
            borderColor: theme.accent,
          },
        ]}
      >
        {isSelected && <Text style={styles.checkmark}>✓</Text>}
      </View>
    </Pressable>
  );
}

function AddCustomModal({ visible, onClose, onSave, styles, theme, t }) {
  const [name, setName] = useState("");
  const [category, setCategory] = useState("strength");

  useEffect(() => {
    if (visible) {
      setName("");
      setCategory("strength");
    }
  }, [visible]);

  const submit = () => {
    if (!name.trim()) return;
    onSave(name.trim(), category);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>
            {t.addCustomExercise ?? "Add custom exercise"}
          </Text>

          <Text style={styles.modalLabel}>{t.name ?? "Name"}</Text>
          <TextInput
            style={styles.modalInput}
            placeholder={t.exerciseNamePlaceholder ?? "e.g. Cable fly"}
            placeholderTextColor={theme.textMuted}
            value={name}
            onChangeText={setName}
            autoFocus
          />

          <Text style={styles.modalLabel}>{t.category ?? "Category"}</Text>
          <View style={styles.modalChips}>
            {CATEGORIES.map((c) => (
              <TouchableOpacity
                key={c.key}
                onPress={() => setCategory(c.key)}
                style={[
                  styles.modalChip,
                  category === c.key && styles.modalChipActive,
                ]}
              >
                <Text
                  style={[
                    styles.modalChipText,
                    category === c.key && styles.modalChipTextActive,
                  ]}
                >
                  {t[c.labelKey] ?? c.labelKey}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.modalActions}>
            <TouchableOpacity onPress={onClose} style={styles.modalCancel}>
              <Text style={styles.modalCancelText}>{t.cancel ?? "Cancel"}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={submit}
              style={[styles.modalSave, !name.trim() && { opacity: 0.4 }]}
              disabled={!name.trim()}
            >
              <Text style={styles.modalSaveText}>{t.save ?? "Save"}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const getStyles = (theme, insets) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.bg },
    center: { justifyContent: "center", alignItems: "center" },

    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingHorizontal: Spacing.lg,
      paddingBottom: Spacing.lg,
      backgroundColor: theme.accent,
    },
    headerBtn: { width: 40 },
    headerBtnRight: { width: 40, alignItems: "flex-end" },
    headerBack: { color: "#fff", fontSize: 28, lineHeight: 34 },
    headerTitle: {
      flex: 1,
      color: "#fff",
      fontSize: FontSize.lg,
      fontWeight: "600",
      textAlign: "center",
    },

    searchBar: {
      flexDirection: "row",
      alignItems: "center",
      margin: 16,
      marginBottom: 8,
      paddingHorizontal: 14,
      backgroundColor: theme.surface,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: theme.border,
    },
    searchInput: {
      flex: 1,
      paddingVertical: 12,
      fontSize: 14,
      color: theme.text,
    },
    clearBtn: { color: theme.textMuted, fontSize: 16, paddingHorizontal: 6 },

    sectionHeader: {
      fontSize: 14,
      fontWeight: "700",
      color: theme.text,
      marginBottom: 10,
    },
    sectionCount: {
      fontSize: 13,
      fontWeight: "500",
      color: theme.textMuted,
    },

    groupHeader: {
      fontSize: 11,
      fontWeight: "700",
      letterSpacing: 0.6,
      textTransform: "uppercase",
      color: theme.accent,
      marginTop: 12,
      marginBottom: 6,
    },

    row: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 12,
      paddingHorizontal: 14,
      borderRadius: 10,
      marginBottom: 6,
      borderWidth: 1,
      backgroundColor: theme.surface,
    },
    rowSelected: { borderColor: theme.accent },
    rowUnselected: { borderColor: theme.border },
    rowPressed: { opacity: 0.7 },

    checkbox: {
      width: 22,
      height: 22,
      borderRadius: 11,
      borderWidth: 1.5,
      borderColor: theme.border,
      backgroundColor: "transparent",
      alignItems: "center",
      justifyContent: "center",
      marginLeft: 10,
    },
    checkmark: { color: "#fff", fontSize: 13, fontWeight: "700" },

    rowName: { fontSize: 14, color: theme.text, fontWeight: "500" },
    rowBadge: {
      fontSize: 10,
      color: theme.textMuted,
      fontStyle: "italic",
      marginTop: 2,
    },
    rowDelete: { fontSize: 18, color: theme.textMuted },

    emptyText: {
      textAlign: "center",
      color: theme.textMuted,
      fontSize: 13,
      marginTop: 32,
    },

    fab: {
      position: "absolute",
      left: 20,
      right: 20,
      backgroundColor: theme.accent,
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: "center",
      shadowColor: "#000",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 8,
      elevation: 4,
    },
    fabText: { color: "#fff", fontSize: 14, fontWeight: "700" },

    modalBackdrop: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.5)",
      justifyContent: "flex-end",
    },
    modalCard: {
      backgroundColor: theme.bg,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      padding: 20,
      paddingBottom: 36,
    },
    modalTitle: {
      fontSize: 18,
      fontWeight: "700",
      color: theme.text,
      marginBottom: 16,
    },
    modalLabel: {
      fontSize: 12,
      fontWeight: "600",
      color: theme.textMuted,
      marginBottom: 6,
      marginTop: 12,
      textTransform: "uppercase",
      letterSpacing: 0.4,
    },
    modalInput: {
      backgroundColor: theme.surface,
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 14,
      color: theme.text,
    },
    modalChips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    modalChip: {
      paddingHorizontal: 14,
      paddingVertical: 7,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.surface,
      marginRight: 8,
      marginBottom: 8,
    },
    modalChipActive: {
      backgroundColor: theme.accent,
      borderColor: theme.accent,
    },
    modalChipText: { fontSize: 12, color: theme.text, fontWeight: "600" },
    modalChipTextActive: { color: "#fff" },
    modalActions: { flexDirection: "row", gap: 10, marginTop: 20 },
    modalCancel: {
      flex: 1,
      paddingVertical: 13,
      alignItems: "center",
      borderRadius: 10,
      borderWidth: 1,
      borderColor: theme.border,
    },
    modalCancelText: { color: theme.text, fontSize: 14, fontWeight: "600" },
    modalSave: {
      flex: 1,
      paddingVertical: 13,
      alignItems: "center",
      borderRadius: 10,
      backgroundColor: theme.accent,
    },
    modalSaveText: { color: "#fff", fontSize: 14, fontWeight: "700" },
  });