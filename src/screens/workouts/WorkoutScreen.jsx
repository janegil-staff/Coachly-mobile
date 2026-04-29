// screens/WorkoutsScreen.jsx
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
  const { colors } = useTheme();
  const { t } = useLang();
  const styles = getStyles(colors);

  const [customExercises, setCustomExercises] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [showAdd, setShowAdd] = useState(false);

  // Hardcoded catalog with translated names
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

  // Merge catalog + custom
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

  // Group by category when "all" is active
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
        err?.response?.data?.error ?? t.exerciseCreateFailed ?? "Could not add exercise."
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
              setCustomExercises((prev) => prev.filter((e) => e._id !== item._id));
            } catch {
              Alert.alert(t.error ?? "Error", t.exerciseDeleteFailed ?? "Could not delete.");
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Search */}
      <View style={styles.searchBar}>
        <TextInput
          style={styles.searchInput}
          placeholder={t.searchExercises ?? "Search exercises…"}
          placeholderTextColor={colors.muted}
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

      {/* Category chips */}
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

      {/* List */}
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
            <ExerciseRow ex={item} styles={styles} t={t} onDelete={handleDelete} />
          )}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              {t.noExercisesFound ?? "No exercises found."}
            </Text>
          }
          contentContainerStyle={{ padding: 16, paddingBottom: 100 }}
        />
      )}

      {/* Add button */}
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
        colors={colors}
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

function AddCustomModal({ visible, onClose, onSave, styles, colors, t }) {
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
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalBackdrop}>
        <View style={styles.modalCard}>
          <Text style={styles.modalTitle}>
            {t.addCustomExercise ?? "Add custom exercise"}
          </Text>

          <Text style={styles.modalLabel}>{t.name ?? "Name"}</Text>
          <TextInput
            style={styles.modalInput}
            placeholder={t.exerciseNamePlaceholder ?? "e.g. Cable fly"}
            placeholderTextColor={colors.muted}
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

const getStyles = (colors) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    center: { justifyContent: "center", alignItems: "center" },

    searchBar: {
      flexDirection: "row",
      alignItems: "center",
      margin: 16,
      marginBottom: 8,
      paddingHorizontal: 14,
      backgroundColor: colors.card,
      borderRadius: 12,
      borderWidth: 1,
      borderColor: colors.border,
    },
    searchInput: { flex: 1, paddingVertical: 12, fontSize: 14, color: colors.text },
    clearBtn: { color: colors.muted, fontSize: 16, paddingHorizontal: 6 },

    chipsRow: { paddingHorizontal: 16, paddingBottom: 8, gap: 8 },
    chip: {
      paddingHorizontal: 14,
      paddingVertical: 7,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
      marginRight: 8,
    },
    chipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
    chipText: { fontSize: 12, fontWeight: "600", color: colors.text },
    chipTextActive: { color: "#fff" },

    groupHeader: {
      fontSize: 11,
      fontWeight: "700",
      letterSpacing: 0.6,
      textTransform: "uppercase",
      color: colors.accent,
      marginTop: 12,
      marginBottom: 6,
    },

    row: {
      flexDirection: "row",
      alignItems: "center",
      paddingVertical: 12,
      paddingHorizontal: 14,
      backgroundColor: colors.card,
      borderRadius: 10,
      marginBottom: 6,
      borderWidth: 1,
      borderColor: colors.border,
    },
    rowName: { fontSize: 14, color: colors.text, fontWeight: "500" },
    rowBadge: { fontSize: 10, color: colors.muted, fontStyle: "italic", marginTop: 2 },
    rowDelete: { fontSize: 18, color: colors.muted, paddingHorizontal: 6 },

    emptyText: { textAlign: "center", color: colors.muted, fontSize: 13, marginTop: 32 },

    fab: {
      position: "absolute",
      bottom: 20,
      left: 20,
      right: 20,
      backgroundColor: colors.accent,
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
      backgroundColor: colors.background,
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      padding: 20,
      paddingBottom: 36,
    },
    modalTitle: { fontSize: 18, fontWeight: "700", color: colors.text, marginBottom: 16 },
    modalLabel: {
      fontSize: 12,
      fontWeight: "600",
      color: colors.muted,
      marginBottom: 6,
      marginTop: 12,
      textTransform: "uppercase",
      letterSpacing: 0.4,
    },
    modalInput: {
      backgroundColor: colors.card,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 10,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 14,
      color: colors.text,
    },
    modalChips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
    modalChip: {
      paddingHorizontal: 14,
      paddingVertical: 7,
      borderRadius: 20,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.card,
      marginRight: 8,
      marginBottom: 8,
    },
    modalChipActive: { backgroundColor: colors.accent, borderColor: colors.accent },
    modalChipText: { fontSize: 12, color: colors.text, fontWeight: "600" },
    modalChipTextActive: { color: "#fff" },
    modalActions: { flexDirection: "row", gap: 10, marginTop: 20 },
    modalCancel: {
      flex: 1,
      paddingVertical: 13,
      alignItems: "center",
      borderRadius: 10,
      borderWidth: 1,
      borderColor: colors.border,
    },
    modalCancelText: { color: colors.text, fontSize: 14, fontWeight: "600" },
    modalSave: {
      flex: 1,
      paddingVertical: 13,
      alignItems: "center",
      borderRadius: 10,
      backgroundColor: colors.accent,
    },
    modalSaveText: { color: "#fff", fontSize: 14, fontWeight: "700" },
  });