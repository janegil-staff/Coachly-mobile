// src/screens/workouts/WorkoutsScreen.jsx
import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Modal,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { useTheme } from "../../context/ThemeContext";
import { useLang } from "../../context/LangContext";
import { getTranslatedCatalog } from "../../lib/exerciseCatalog";
import {
  fetchCustomExercises,
  createCustomExercise,
  deleteCustomExercise,
} from "../../api/exercises";

const CATEGORIES = [
  { key: "all",      labelKey: "categoryAll" },
  { key: "strength", labelKey: "categoryStrength" },
  { key: "cardio",   labelKey: "categoryCardio" },
  { key: "mobility", labelKey: "categoryMobility" },
  { key: "recovery", labelKey: "categoryRecovery" },
  { key: "other",    labelKey: "categoryOther" },
];

export default function WorkoutsScreen() {
  const { theme } = useTheme();
  const { t } = useLang();
  const styles = getStyles(theme);

  const [customExercises, setCustomExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [showAdd, setShowAdd] = useState(false);

  const catalog = useMemo(() => getTranslatedCatalog(t), [t]);

  const load = useCallback(async () => {
    try {
      const res = await fetchCustomExercises();
      setCustomExercises(res.exercises || []);
    } catch (err) {
      console.warn("Failed to load custom exercises", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const allExercises = useMemo(
    () => [
      ...catalog,
      ...customExercises.map((e) => ({ ...e, isCustom: true })),
    ],
    [catalog, customExercises]
  );

  const filtered = useMemo(() => {
    let list = allExercises;
    if (activeCategory !== "all") {
      list = list.filter((e) => e.category === activeCategory);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter((e) => e.name.toLowerCase().includes(q));
    }
    return list;
  }, [allExercises, activeCategory, search]);

  const grouped = useMemo(() => {
    if (activeCategory !== "all") return null;
    const map = {};
    for (const e of filtered) (map[e.category] ||= []).push(e);
    return CATEGORIES.filter((c) => c.key !== "all" && map[c.key]?.length).map(
      (c) => ({ ...c, items: map[c.key] })
    );
  }, [filtered, activeCategory]);

  const handleAdd = async (name, category) => {
    try {
      const res = await createCustomExercise({ name, category });
      setCustomExercises((prev) => [...prev, res.exercise]);
      setShowAdd(false);
    } catch (err) {
      Alert.alert(
        t.error ?? "Error",
        err?.message ?? t.exerciseCreateFailed ?? "Could not add exercise."
      );
    }
  };

  const handleDelete = (item) => {
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
              await deleteCustomExercise(item._id);
              setCustomExercises((prev) =>
                prev.filter((e) => e._id !== item._id)
              );
            } catch {
              Alert.alert(
                t.error ?? "Error",
                t.exerciseDeleteFailed ?? "Could not delete."
              );
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator color={theme.accent} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
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
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chipsRow}
      >
        {CATEGORIES.map((c) => (
          <TouchableOpacity
            key={c.key}
            onPress={() => setActiveCategory(c.key)}
            style={[styles.chip, activeCategory === c.key && styles.chipActive]}
          >
            <Text
              style={[
                styles.chipText,
                activeCategory === c.key && styles.chipTextActive,
              ]}
            >
              {t[c.labelKey] ?? c.labelKey}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {grouped ? (
        <FlatList
          data={grouped}
          keyExtractor={(g) => g.key}
          renderItem={({ item: group }) => (
            <View style={{ marginBottom: 8 }}>
              <Text style={styles.groupHeader}>
                {t[group.labelKey] ?? group.labelKey}
              </Text>
              {group.items.map((ex) => (
                <ExerciseRow
                  key={ex._id}
                  ex={ex}
                  styles={styles}
                  t={t}
                  onDelete={handleDelete}
                />
              ))}
            </View>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              {t.noExercisesFound ?? "No exercises found."}
            </Text>
          }
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        />
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(e) => e._id}
          renderItem={({ item }) => (
            <ExerciseRow
              ex={item}
              styles={styles}
              t={t}
              onDelete={handleDelete}
            />
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              {t.noExercisesFound ?? "No exercises found."}
            </Text>
          }
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        />
      )}

      <TouchableOpacity
        style={styles.fab}
        onPress={() => setShowAdd(true)}
        activeOpacity={0.85}
      >
        <Text style={styles.fabText}>+ {t.addCustom ?? "Add custom"}</Text>
      </TouchableOpacity>

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

function ExerciseRow({ ex, styles, t, onDelete }) {
  return (
    <View style={styles.row}>
      <View style={{ flex: 1 }}>
        <Text style={styles.rowName}>{ex.name}</Text>
        {ex.isCustom && (
          <Text style={styles.rowBadge}>{t.customLabel ?? "Custom"}</Text>
        )}
      </View>
      {ex.isCustom && (
        <TouchableOpacity onPress={() => onDelete(ex)} hitSlop={10}>
          <Text style={styles.rowDelete}>✕</Text>
        </TouchableOpacity>
      )}
    </View>
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
            {CATEGORIES.filter((c) => c.key !== "all").map((c) => (
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

const getStyles = (theme) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.bg },
    center: { justifyContent: "center", alignItems: "center" },

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

    chipsRow: { paddingHorizontal: 16, paddingBottom: 8, gap: 8 },
    chip: {
      paddingHorizontal: 14,
      paddingVertical: 7,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.surface,
      marginRight: 8,
    },
    chipActive: { backgroundColor: theme.accent, borderColor: theme.accent },
    chipText: { fontSize: 12, fontWeight: "600", color: theme.text },
    chipTextActive: { color: "#fff" },

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
      backgroundColor: theme.surface,
      borderRadius: 10,
      marginBottom: 6,
      borderWidth: 1,
      borderColor: theme.border,
    },
    rowName: { fontSize: 14, color: theme.text, fontWeight: "500" },
    rowBadge: {
      fontSize: 10,
      color: theme.textMuted,
      fontStyle: "italic",
      marginTop: 2,
    },
    rowDelete: { fontSize: 18, color: theme.textMuted, paddingHorizontal: 6 },

    emptyText: {
      textAlign: "center",
      color: theme.textMuted,
      fontSize: 13,
      marginTop: 32,
    },

    fab: {
      position: "absolute",
      bottom: 20,
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