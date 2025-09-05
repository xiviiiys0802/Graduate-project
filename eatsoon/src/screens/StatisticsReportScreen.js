import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Theme } from '../utils/colors';
import { Container, Card, Button, ButtonText } from '../components/StyledComponents';
import { 
  BarChart, 
  PieChart, 
  LineChart, 
  StatCard, 
  StatSection 
} from '../components/ChartComponents';
import StatisticsService from '../services/statisticsService';
import { useFocusEffect } from '@react-navigation/native';

export default function StatisticsReportScreen() {
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState('week'); // week, month, year
  const navigation = useNavigation();

  useEffect(() => {
    loadStatistics();
  }, []);

  // 화면이 포커스될 때마다 통계 새로고침
  useFocusEffect(
    React.useCallback(() => {
      loadStatistics();
    }, [])
  );

  const loadStatistics = async () => {
    try {
      setLoading(true);
      const stats = await StatisticsService.loadStatistics();
      setStatistics(stats);
    } catch (error) {
      console.error('통계 로드 실패:', error);
      Alert.alert('오류', '통계 데이터를 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadStatistics();
    setRefreshing(false);
  };

  const resetStatistics = () => {
    Alert.alert(
      '통계 초기화',
      '모든 통계 데이터가 삭제됩니다. 정말 초기화하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        { 
          text: '초기화', 
          style: 'destructive',
          onPress: async () => {
            try {
              await StatisticsService.resetStatistics();
              await loadStatistics();
              Alert.alert('완료', '통계가 초기화되었습니다.');
            } catch (error) {
              console.error('통계 초기화 실패:', error);
              Alert.alert('오류', '통계 초기화에 실패했습니다.');
            }
          }
        }
      ]
    );
  };

  const getCategoryName = (category) => {
    const categoryNames = {
      dairy: '유제품',
      meat: '육류',
      vegetables: '채소',
      fruits: '과일',
      grains: '곡물',
      beverages: '음료',
      snacks: '간식',
      others: '기타',
    };
    return categoryNames[category] || category;
  };

  const getWeeklyData = () => {
    if (!statistics) return [];
    
    const days = ['월', '화', '수', '목', '금', '토', '일'];
    // 실제 데이터가 없으므로 임시로 랜덤 데이터 생성
    // 나중에 실제 주간 데이터를 저장하는 기능을 추가할 수 있음
    return days.map((day, index) => ({
      label: day,
      value: Math.floor(Math.random() * 5) + 1,
    }));
  };

  const getCategoryData = () => {
    if (!statistics) return [];
    
    return Object.entries(statistics.categories)
      .filter(([_, value]) => value > 0)
      .map(([category, value]) => ({
        label: getCategoryName(category),
        value: value,
      }))
      .sort((a, b) => b.value - a.value);
  };

  const getNotificationData = () => {
    if (!statistics) return [];
    
    return [
      { label: '전송된 알림', value: statistics.notificationsSent },
      { label: '수신된 알림', value: statistics.notificationsReceived },
    ];
  };

  if (loading) {
    return (
      <Container>
        <View style={styles.loadingContainer}>
          <Ionicons name="analytics" size={48} color={Colors.primary} />
          <Text style={styles.loadingText}>통계 데이터를 불러오는 중...</Text>
        </View>
      </Container>
    );
  }

  return (
    <Container>
      <ScrollView 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* 기간 선택 */}
        <View style={styles.periodSelector}>
          <TouchableOpacity
            style={[
              styles.periodButton,
              selectedPeriod === 'week' && styles.periodButtonActive
            ]}
            onPress={() => setSelectedPeriod('week')}
          >
            <Text style={[
              styles.periodButtonText,
              selectedPeriod === 'week' && styles.periodButtonTextActive
            ]}>
              주간
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.periodButton,
              selectedPeriod === 'month' && styles.periodButtonActive
            ]}
            onPress={() => setSelectedPeriod('month')}
          >
            <Text style={[
              styles.periodButtonText,
              selectedPeriod === 'month' && styles.periodButtonTextActive
            ]}>
              월간
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.periodButton,
              selectedPeriod === 'year' && styles.periodButtonActive
            ]}
            onPress={() => setSelectedPeriod('year')}
          >
            <Text style={[
              styles.periodButtonText,
              selectedPeriod === 'year' && styles.periodButtonTextActive
            ]}>
              연간
            </Text>
          </TouchableOpacity>
        </View>

        {/* 요약 통계 */}
        <StatSection title="요약 통계">
          <View style={styles.summaryGrid}>
            <StatCard
              title="총 등록 음식"
              value={statistics?.totalFoodItems || 0}
              subtitle="개"
              icon={<Ionicons name="restaurant" size={16} color={Colors.primary} />}
              color={Colors.primary}
            />
            <StatCard
              title="유통기한 임박"
              value={statistics?.expiringSoonItems || 0}
              subtitle="개"
              icon={<Ionicons name="warning" size={16} color={Colors.warning} />}
              color={Colors.warning}
            />
            <StatCard
              title="만료된 음식"
              value={statistics?.expiredItems || 0}
              subtitle="개"
              icon={<Ionicons name="close-circle" size={16} color={Colors.danger} />}
              color={Colors.danger}
            />
            <StatCard
              title="이번 주 추가"
              value={statistics?.weeklyStats?.foodAdded || 0}
              subtitle="개"
              icon={<Ionicons name="add-circle" size={16} color={Colors.success} />}
              color={Colors.success}
            />
          </View>
        </StatSection>

        {/* 카테고리별 분포 */}
        <StatSection title="카테고리별 분포">
          <PieChart
            data={getCategoryData()}
            title="등록된 음식 카테고리"
            size={180}
          />
          {getCategoryData().length === 0 && (
            <View style={styles.emptyState}>
              <Ionicons name="pie-chart" size={48} color={Colors.textSecondary} />
              <Text style={styles.emptyStateText}>아직 등록된 음식이 없습니다</Text>
              <Text style={styles.emptyStateSubtext}>음식을 추가하면 통계가 표시됩니다</Text>
            </View>
          )}
        </StatSection>

        {/* 주간 활동 */}
        {selectedPeriod === 'week' && (
          <StatSection title="주간 활동">
            <BarChart
              data={getWeeklyData()}
              title="요일별 음식 추가"
              height={200}
              barColor={Colors.primary}
            />
          </StatSection>
        )}

        {/* 알림 통계 */}
        <StatSection title="알림 통계">
          <View style={styles.notificationStats}>
            <StatCard
              title="전송된 알림"
              value={statistics?.notificationsSent || 0}
              subtitle="개"
              icon={<Ionicons name="send" size={16} color={Colors.info} />}
              color={Colors.info}
            />
            <StatCard
              title="수신된 알림"
              value={statistics?.notificationsReceived || 0}
              subtitle="개"
              icon={<Ionicons name="notifications" size={16} color={Colors.success} />}
              color={Colors.success}
            />
          </View>
        </StatSection>

        {/* 월간 통계 */}
        {selectedPeriod === 'month' && (
          <StatSection title="월간 통계">
            <View style={styles.monthlyStats}>
              <StatCard
                title="이번 달 추가"
                value={statistics?.monthlyStats?.foodAdded || 0}
                subtitle="개"
                color={Colors.primary}
              />
              <StatCard
                title="가장 많이 추가한 카테고리"
                value={getCategoryName(statistics?.monthlyStats?.mostAddedCategory || '')}
                subtitle=""
                color={Colors.success}
              />
            </View>
          </StatSection>
        )}

        {/* 연간 통계 */}
        {selectedPeriod === 'year' && (
          <StatSection title="연간 통계">
            <View style={styles.yearlyStats}>
              <StatCard
                title="올해 총 추가"
                value={statistics?.totalFoodItems || 0}
                subtitle="개"
                color={Colors.primary}
              />
              <StatCard
                title="올해 총 알림"
                value={statistics?.notificationsSent || 0}
                subtitle="개"
                color={Colors.info}
              />
            </View>
          </StatSection>
        )}

        {/* 데이터 업데이트 정보 */}
        <Card style={styles.updateInfoCard}>
          <View style={styles.updateInfoHeader}>
            <Ionicons name="information-circle" size={20} color={Colors.info} />
            <Text style={styles.updateInfoTitle}>데이터 정보</Text>
          </View>
          <Text style={styles.updateInfoText}>
            마지막 업데이트: {statistics?.lastUpdated 
              ? new Date(statistics.lastUpdated).toLocaleString('ko-KR')
              : '업데이트 정보 없음'
            }
          </Text>
          <Text style={styles.updateInfoText}>
            통계는 음식 등록, 삭제, 알림 등의 활동을 기반으로 자동으로 수집됩니다.
          </Text>
        </Card>

        {/* 통계 초기화 버튼 */}
        <Button 
          style={styles.resetButtonLarge}
          onPress={resetStatistics}
        >
          <Ionicons name="refresh" size={20} color={Colors.white} />
          <ButtonText style={styles.resetButtonText}>통계 초기화</ButtonText>
        </Button>
      </ScrollView>
    </Container>
  );
}

const styles = StyleSheet.create({

  // 로딩
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: Theme.typography.body.fontSize,
    color: Colors.textSecondary,
    marginTop: Theme.spacing.md,
  },

  // 기간 선택
  periodSelector: {
    flexDirection: 'row',
    marginHorizontal: Theme.spacing.md,
    marginVertical: Theme.spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: Theme.borderRadius.md,
    padding: Theme.spacing.xs,
    ...Theme.shadows.small,
  },
  periodButton: {
    flex: 1,
    paddingVertical: Theme.spacing.sm,
    alignItems: 'center',
    borderRadius: Theme.borderRadius.sm,
  },
  periodButtonActive: {
    backgroundColor: Colors.primary,
  },
  periodButtonText: {
    fontSize: Theme.typography.body.fontSize,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  periodButtonTextActive: {
    color: Colors.white,
    fontWeight: '600',
  },

  // 요약 그리드
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },

  // 알림 통계
  notificationStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  // 월간 통계
  monthlyStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  // 연간 통계
  yearlyStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },

  // 업데이트 정보
  updateInfoCard: {
    marginHorizontal: Theme.spacing.md,
    marginBottom: Theme.spacing.md,
    backgroundColor: Colors.info + '10',
    borderColor: Colors.info + '30',
    borderWidth: 1,
  },
  updateInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Theme.spacing.sm,
  },
  updateInfoTitle: {
    fontSize: Theme.typography.body.fontSize,
    fontWeight: '600',
    color: Colors.info,
    marginLeft: Theme.spacing.xs,
  },
  updateInfoText: {
    fontSize: Theme.typography.small.fontSize,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginBottom: Theme.spacing.xs,
  },

  // 초기화 버튼
  resetButtonLarge: {
    marginHorizontal: Theme.spacing.md,
    marginBottom: Theme.spacing.lg,
    backgroundColor: Colors.warning,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  resetButtonText: {
    marginLeft: Theme.spacing.xs,
  },

  // 빈 상태
  emptyState: {
    alignItems: 'center',
    padding: Theme.spacing.lg,
  },
  emptyStateText: {
    fontSize: Theme.typography.body.fontSize,
    color: Colors.textSecondary,
    marginTop: Theme.spacing.sm,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontSize: Theme.typography.small.fontSize,
    color: Colors.textSecondary,
    marginTop: Theme.spacing.xs,
    textAlign: 'center',
  },
});
