// src/screens/NotificationHistoryScreen.js
import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
  ScrollView
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Theme } from '../utils/colors';
import { 
  Container, 
  Card, 
  Button, 
  ButtonText,
  SectionHeader,
  Divider
} from '../components/StyledComponents';
import { 
  getNotificationHistory, 
  markNotificationAsRead, 
  markAllNotificationsAsRead,
  deleteNotification,
  clearAllNotifications,
  filterNotificationsByType,
  groupNotificationsByDate,
  getUnreadNotificationCount
} from '../utils/notificationHistory';

export default function NotificationHistoryScreen() {
  const [notifications, setNotifications] = useState([]);
  const [groupedNotifications, setGroupedNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [unreadCount, setUnreadCount] = useState(0);
  const [allNotifications, setAllNotifications] = useState([]); // 전체 알림 저장
  const navigation = useNavigation();

  useEffect(() => {
    loadNotifications();
  }, []);

  // selectedFilter가 변경될 때마다 자동으로 필터링
  useEffect(() => {
    if (selectedFilter) {
      console.log('[DEBUG] 필터 변경 감지:', selectedFilter);
      loadNotifications();
    }
  }, [selectedFilter]);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const history = await getNotificationHistory();
      
      // 전체 알림 저장 (필터와 관계없이)
      setAllNotifications(history);
      
      console.log('[DEBUG] 전체 알림 개수:', history?.length || 0);
      console.log('[DEBUG] 선택된 필터:', selectedFilter);
      
      // 필터 적용
      let filteredHistory = history;
      if (selectedFilter && selectedFilter !== 'all') {
        filteredHistory = filterNotificationsByType(history, selectedFilter);
        console.log('[DEBUG] 필터링된 알림 개수:', filteredHistory?.length || 0);
        console.log('[DEBUG] 필터링된 알림들:', filteredHistory.map(n => ({ type: n.type, title: n.title })));
      }
      
      // 상태 업데이트를 한 번에 처리
      setNotifications(filteredHistory);
      setGroupedNotifications(groupNotificationsByDate(filteredHistory));
      
      // 읽지 않은 알림 개수 업데이트 (전체 알림 기준)
      const count = (history?.filter(notification => !notification.read) || []).length;
      setUnreadCount(count);
    } catch (error) {
      console.error('알림 히스토리 불러오기 실패:', error);
      Alert.alert('오류', '알림 히스토리를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadNotifications();
  };

  const handleFilterChange = (filter) => {
    console.log('[DEBUG] 필터 변경 요청:', { 이전_필터: selectedFilter, 새_필터: filter });
    setSelectedFilter(filter);
    // useEffect에서 자동으로 loadNotifications() 호출됨
  };

  const handleNotificationPress = async (notification) => {
    if (!notification.read) {
      await markNotificationAsRead(notification.id);
      setUnreadCount(prev => Math.max(0, prev - 1));
      
      // 목록 업데이트
      const updatedNotifications = notifications.map(n => 
        n.id === notification.id ? { ...n, read: true } : n
      );
      setNotifications(updatedNotifications);
      setGroupedNotifications(groupNotificationsByDate(updatedNotifications));
    }
  };

  const handleDeleteNotification = async (notificationId) => {
    Alert.alert(
      '알림 삭제',
      '이 알림을 삭제하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            await deleteNotification(notificationId);
            loadNotifications();
          }
        }
      ]
    );
  };

  const handleMarkAllAsRead = async () => {
    Alert.alert(
      '모든 알림 읽음 처리',
      '모든 알림을 읽음 처리하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '확인',
          onPress: async () => {
            await markAllNotificationsAsRead();
            setUnreadCount(0);
            loadNotifications();
          }
        }
      ]
    );
  };

  const handleClearAll = async () => {
    Alert.alert(
      '모든 알림 삭제',
      '모든 알림을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            await clearAllNotifications();
            // 모든 상태 초기화
            setNotifications([]);
            setGroupedNotifications([]);
            setUnreadCount(0);
            // 필터도 전체로 리셋
            setSelectedFilter('all');
          }
        }
      ]
    );
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'expiry':
        return '⚠️';
      case 'stock':
        return '📦';
      case 'daily':
        return '📅';
      case 'smart':
        return '🧠';
      case 'recipe':
        return '👨‍🍳';
      default:
        return '🔔';
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'expiry':
        return Colors.danger;
      case 'stock':
        return Colors.warning;
      case 'daily':
        return Colors.success;
      case 'smart':
        return Colors.info;
      case 'recipe':
        return Colors.primary;
      default:
        return Colors.info;
    }
  };

  const getFilterDisplayName = (filter) => {
    switch (filter) {
      case 'expiry':
        return '유통기한';
      case 'stock':
        return '재고부족';
      case 'daily':
        return '일일알림';
      case 'smart':
        return '스마트알림';
      case 'recipe':
        return '요리추천';
      default:
        return '전체';
    }
  };

  const renderNotification = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.notificationItem,
        !item.read && styles.unreadNotification
      ]}
      onPress={() => handleNotificationPress(item)}
      onLongPress={() => handleDeleteNotification(item.id)}
    >
      <View style={styles.notificationHeader}>
        <View style={[styles.notificationIconContainer, { backgroundColor: getNotificationColor(item.type) + '20' }]}>
          <Text style={styles.notificationIcon}>
            {getNotificationIcon(item.type)}
          </Text>
        </View>
        <View style={styles.notificationInfo}>
          <Text style={styles.notificationTitle}>{item.title}</Text>
          <Text style={styles.notificationTime}>
            {new Date(item.timestamp).toLocaleString('ko-KR')}
          </Text>
        </View>
        {!item.read && <View style={styles.unreadDot} />}
      </View>
      <Text style={styles.notificationBody}>{item.body}</Text>
    </TouchableOpacity>
  );

  const renderDateHeader = ({ item }) => (
    <View style={styles.dateHeader}>
      <Text style={styles.dateText}>{item.date}</Text>
    </View>
  );

  const renderFilterButtons = () => (
    <View style={styles.filterContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <TouchableOpacity
          style={[
            styles.filterButton,
            selectedFilter === 'all' && styles.filterButtonActive
          ]}
          onPress={() => handleFilterChange('all')}
        >
          <Text style={[
            styles.filterButtonText,
            selectedFilter === 'all' && styles.filterButtonTextActive
          ]}>
            전체 ({allNotifications?.length || 0})
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.filterButton,
            selectedFilter === 'expiry' && styles.filterButtonActive
          ]}
          onPress={() => handleFilterChange('expiry')}
        >
          <Text style={[
            styles.filterButtonText,
            selectedFilter === 'expiry' && styles.filterButtonTextActive
          ]}>
            유통기한 ({(filterNotificationsByType(allNotifications, 'expiry') || []).length})
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.filterButton,
            selectedFilter === 'stock' && styles.filterButtonActive
          ]}
          onPress={() => handleFilterChange('stock')}
        >
          <Text style={[
            styles.filterButtonText,
            selectedFilter === 'stock' && styles.filterButtonTextActive
          ]}>
            재고부족 ({(filterNotificationsByType(allNotifications, 'stock') || []).length})
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.filterButton,
            selectedFilter === 'daily' && styles.filterButtonActive
          ]}
          onPress={() => handleFilterChange('daily')}
        >
          <Text style={[
            styles.filterButtonText,
            selectedFilter === 'daily' && styles.filterButtonTextActive
          ]}>
            일일알림 ({(filterNotificationsByType(allNotifications, 'daily') || []).length})
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.filterButton,
            selectedFilter === 'smart' && styles.filterButtonActive
          ]}
          onPress={() => handleFilterChange('smart')}
        >
          <Text style={[
            styles.filterButtonText,
            selectedFilter === 'smart' && styles.filterButtonTextActive
          ]}>
            스마트알림 ({(filterNotificationsByType(allNotifications, 'smart') || []).length})
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[
            styles.filterButton,
            selectedFilter === 'recipe' && styles.filterButtonActive
          ]}
          onPress={() => handleFilterChange('recipe')}
        >
          <Text style={[
            styles.filterButtonText,
            selectedFilter === 'recipe' && styles.filterButtonTextActive
          ]}>
            요리추천 ({(filterNotificationsByType(allNotifications, 'recipe') || []).length})
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );

  if (loading) {
    return (
      <Container>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>알림을 불러오는 중...</Text>
        </View>
      </Container>
    );
  }

  return (
    <Container>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.navigate('Main', { screen: 'Profile' })}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={28} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>알림 히스토리</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* 필터 버튼 */}
      {renderFilterButtons()}

      {/* 알림 목록 */}
      <FlatList
        data={groupedNotifications}
        keyExtractor={(item, index) => `group-${index}`}
        renderItem={({ item }) => (
          <View>
            {renderDateHeader({ item })}
            {item.notifications.map(notification => (
              <View key={notification.id}>
                {renderNotification({ item: notification })}
              </View>
            ))}
          </View>
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="notifications-off" size={64} color={Colors.textSecondary} />
            <Text style={styles.emptyTitle}>알림이 없습니다</Text>
            <Text style={styles.emptySubtitle}>
              {selectedFilter === 'all' 
                ? '아직 받은 알림이 없습니다.' 
                : `${getFilterDisplayName(selectedFilter)} 알림이 없습니다.`}
            </Text>
          </View>
        }
        ListHeaderComponent={
          (notifications?.length || 0) > 0 ? (
            <View style={styles.listHeader}>
              <View style={styles.headerActions}>
                <TouchableOpacity style={styles.headerButton} onPress={handleMarkAllAsRead}>
                  <Ionicons name="checkmark-done" size={16} color={Colors.textSecondary} />
                  <Text style={styles.headerButtonText}>모두 읽음</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.headerButton} onPress={handleClearAll}>
                  <Ionicons name="trash" size={16} color={Colors.danger} />
                  <Text style={[styles.headerButtonText, { color: Colors.danger }]}>모두 삭제</Text>
                </TouchableOpacity>
              </View>
              <Text style={styles.notificationCount}>
                총 {notifications?.length || 0}개의 알림
                {unreadCount > 0 && ` (읽지 않은 ${unreadCount}개)`}
              </Text>
            </View>
          ) : null
        }
      />
    </Container>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: Theme.spacing.md,
    fontSize: Theme.typography.body.fontSize,
    color: Colors.textSecondary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.lg,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    marginBottom: Theme.spacing.md,
    minHeight: 60,
  },
  backButton: {
    padding: Theme.spacing.md,
    marginLeft: -Theme.spacing.sm,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: Theme.typography.h3.fontSize,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  headerSpacer: {
    width: 44,
  },
  listHeader: {
    backgroundColor: Colors.surface,
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    marginBottom: Theme.spacing.md,
  },
  headerActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.sm,
  },
  headerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Theme.spacing.sm,
    paddingVertical: Theme.spacing.xs,
    borderRadius: Theme.borderRadius.sm,
    backgroundColor: Colors.border,
  },
  headerButtonText: {
    fontSize: Theme.typography.small.fontSize,
    color: Colors.textSecondary,
    marginLeft: Theme.spacing.xs,
  },
  notificationCount: {
    fontSize: Theme.typography.small.fontSize,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  filterContainer: {
    backgroundColor: Colors.surface,
    paddingVertical: Theme.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    marginBottom: Theme.spacing.md,
  },
  filterButton: {
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm,
    marginHorizontal: Theme.spacing.xs,
    borderRadius: Theme.borderRadius.round,
    backgroundColor: Colors.border,
  },
  filterButtonActive: {
    backgroundColor: Colors.primary,
  },
  filterButtonText: {
    fontSize: Theme.typography.small.fontSize,
    color: Colors.textSecondary,
  },
  filterButtonTextActive: {
    color: Colors.white,
    fontWeight: '500',
  },
  dateHeader: {
    backgroundColor: Colors.background,
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm,
    marginBottom: Theme.spacing.xs,
  },
  dateText: {
    fontSize: Theme.typography.small.fontSize,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  notificationItem: {
    backgroundColor: Colors.surface,
    padding: Theme.spacing.md,
    marginBottom: Theme.spacing.sm,
    borderRadius: Theme.borderRadius.md,
    borderLeftWidth: 4,
    borderLeftColor: Colors.border,
  },
  unreadNotification: {
    borderLeftColor: Colors.primary,
    backgroundColor: Colors.background,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Theme.spacing.sm,
  },
  notificationIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Theme.spacing.sm,
  },
  notificationIcon: {
    fontSize: 20,
  },
  notificationInfo: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: Theme.typography.body.fontSize,
    fontWeight: '500',
    color: Colors.textPrimary,
  },
  notificationTime: {
    fontSize: Theme.typography.small.fontSize,
    color: Colors.textSecondary,
    marginTop: Theme.spacing.xs,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  notificationBody: {
    fontSize: Theme.typography.body.fontSize,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Theme.spacing.xl,
  },
  emptyTitle: {
    fontSize: Theme.typography.h4.fontSize,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginTop: Theme.spacing.md,
    marginBottom: Theme.spacing.xs,
  },
  emptySubtitle: {
    fontSize: Theme.typography.body.fontSize,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
});
