import React, { useState, useEffect, useCallback } from "react";
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  StyleSheet, 
  ActivityIndicator,
  Alert, 
  RefreshControl 
} from "react-native";
import { apiClient } from "../lib/api";

export function TasksScreen() {
  const [tasks, setTasks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchTasks = useCallback(async () => {
    try {
      const res = await apiClient.get("/api/mobile/tasks"); 
      // 👇 FIXED: Extracting the 'tasks' array from the backend response
      setTasks(res.data.tasks || []);
    } catch (err) {
      console.error("Failed to fetch tasks:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { 
    fetchTasks(); 
  }, [fetchTasks]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchTasks();
  };

  const handleComplete = async (taskId: string) => {
    // Optimistic UI: Remove it from the list instantly for a snappy feel
    const previousTasks = [...tasks];
    setTasks(tasks.filter((t: any) => t.id !== taskId));

    try {
      await apiClient.post(`/api/mobile/tasks/${taskId}/complete`);
    } catch (err) {
      Alert.alert("Error", "Failed to complete task. Please check your connection.");
      setTasks(previousTasks); // Revert the UI if the API fails
    }
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#2563EB" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={tasks}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🎉</Text>
            <Text style={styles.emptyText}>You're all caught up!</Text>
            <Text style={styles.emptySubText}>No open tasks right now.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.taskCard}>
            <TouchableOpacity 
              style={styles.checkbox} 
              onPress={() => handleComplete(item.id)}
            >
              <View style={styles.checkboxInner} />
            </TouchableOpacity>
            
            <View style={styles.taskContent}>
              <Text style={styles.taskTitle}>{item.title}</Text>
              <Text style={styles.taskDesc}>
                {item.candidate?.name || item.requisition?.code || "General Task"}
              </Text>
              
              {/* Show overdue status if the backend flagged it */}
              {item.isOverdue && (
                <Text style={styles.overdueBadge}>⚠️ Overdue</Text>
              )}
            </View>
          </View>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#F8FAFC" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  
  taskCard: { 
    flexDirection: "row", 
    backgroundColor: "white", 
    padding: 16, 
    borderRadius: 12, 
    marginBottom: 12, 
    alignItems: "flex-start",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  
  checkbox: { 
    width: 24, 
    height: 24, 
    borderRadius: 6, 
    borderWidth: 2, 
    borderColor: "#94A3B8", 
    marginRight: 12, 
    justifyContent: "center", 
    alignItems: "center",
    marginTop: 2
  },
  checkboxInner: { 
    width: 12, 
    height: 12, 
    borderRadius: 2, 
    backgroundColor: "transparent" 
  },
  
  taskContent: { flex: 1 },
  taskTitle: { fontSize: 16, fontWeight: "600", color: "#0F172A", marginBottom: 4 },
  taskDesc: { fontSize: 13, color: "#64748B" },
  overdueBadge: { 
    fontSize: 12, 
    color: "#B91C1C", 
    fontWeight: "600",
    marginTop: 6,
    backgroundColor: "#FEE2E2",
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4
  },
  
  emptyState: { alignItems: "center", marginTop: 60 },
  emptyIcon: { fontSize: 40, marginBottom: 10 },
  emptyText: { fontSize: 18, fontWeight: "700", color: "#0F172A" },
  emptySubText: { fontSize: 14, color: "#64748B", marginTop: 4 },
});
