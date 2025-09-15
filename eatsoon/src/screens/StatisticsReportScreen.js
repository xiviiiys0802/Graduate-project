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
  const [weeklyData, setWeeklyData] = useState([]);
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
      const [stats, weekly] = await Promise.all([
        StatisticsService.getRealtimeFullStatistics(),
        StatisticsService.getWeeklyFoodAddedData()
      ]);
      setStatistics(stats);
      setWeeklyData(weekly);
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
      '로컬 통계 데이터만 삭제됩니다. 실제 음식 데이터는 그대로 유지됩니다. 정말 초기화하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        { 
          text: '초기화', 
          style: 'destructive',
          onPress: async () => {
            try {
              await StatisticsService.resetStatistics();
              await loadStatistics();
              Alert.alert('완료', '로컬 통계가 초기화되었습니다. 실제 음식 데이터는 그대로 유지됩니다.');
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
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.navigate('Main', { screen: 'Profile' })}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>사용 통계</Text>
        <TouchableOpacity 
          style={styles.resetButton}
          onPress={resetStatistics}
        >
          <Ionicons name="refresh" size={24} color={Colors.warning} />
        </TouchableOpacity>
      </View>

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
              color={Colors.primary}
            />
            <StatCard
              title="유통기한 임박"
              value={statistics?.expiringSoonItems || 0}
              subtitle="개"
              color={Colors.warning}
            />
            <StatCard
              title="만료된 음식"
              value={statistics?.expiredItems || 0}
              subtitle="개"
              color={Colors.danger}
            />
            <StatCard
              title="이번 주 추가"
              value={statistics?.weeklyStats?.foodAdded || 0}
              subtitle="개"
              color={Colors.success}
            />
          </View>
        </StatSection>

        {/* 카테고리별 분포 */}
        <StatSection title="카테고리별 분포">
          <PieChart
            data={getCategoryData()}
            title="등록된 음식 카테고리"
          />
          {getCategoryData().length === 0 && (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>아직 등록된 음식이 없습니다</Text>
            </View>
          )}
        </StatSection>

        {/* 주간 활동 */}
        {selectedPeriod === 'week' && (
          <StatSection title="주간 활동">
            <BarChart
              data={weeklyData}
              title="요일별 음식 추가"
              height={180}
              barColor={Colors.primary}
            />
          </StatSection>
        )}


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
            통계는 실제 음식 데이터를 기반으로 실시간으로 계산됩니다.
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
  // 헤더
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backButton: {
    padding: Theme.spacing.sm,
  },
  headerTitle: {
    fontSize: Theme.typography.h3.fontSize,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  resetButton: {
    padding: Theme.spacing.sm,
  },

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
