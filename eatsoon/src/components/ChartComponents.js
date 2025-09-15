import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { Colors, Theme } from '../utils/colors';

const { width } = Dimensions.get('window');

// 막대 차트 컴포넌트
export const BarChart = ({ data, title, height = 200, barColor = Colors.primary }) => {
  if (!data || data.length === 0) {
    return (
      <View style={[styles.chartContainer, { height }]}>
        <Text style={styles.chartTitle}>{title}</Text>
        <View style={styles.emptyChart}>
          <Text style={styles.emptyText}>데이터가 없습니다</Text>
        </View>
      </View>
    );
  }

  const maxValue = Math.max(...data.map(item => item.value));
  const chartWidth = width - Theme.spacing.md * 2 - 40; // 좌우 패딩과 라벨 공간 제외

  return (
    <View style={[styles.chartContainer, { height }]}>
      <Text style={styles.chartTitle}>{title}</Text>
      <View style={styles.chartContent}>
        <View style={styles.barsContainer}>
          {data.map((item, index) => {
            const barHeight = maxValue > 0 ? (item.value / maxValue) * (height - 100) : 0;
            const isMaxValue = item.value === maxValue;
            return (
              <View key={index} style={styles.barItem}>
                <View style={styles.barContainer}>
                  <View
                    style={[
                      styles.bar,
                      {
                        height: barHeight,
                        backgroundColor: isMaxValue ? barColor : barColor + '80',
                        shadowColor: barColor,
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: 0.3,
                        shadowRadius: 4,
                        elevation: 3,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.barLabel}>{item.label}</Text>
                <Text style={[styles.barValue, { color: isMaxValue ? barColor : Colors.textPrimary }]}>{item.value}</Text>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
};

// 카테고리 분포 차트 (막대 차트 방식)
export const PieChart = ({ data, title, size = 120 }) => {
  if (!data || data.length === 0) {
    return (
      <View style={styles.chartContainer}>
        <Text style={styles.chartTitle}>{title}</Text>
        <View style={styles.emptyChart}>
          <Text style={styles.emptyText}>데이터가 없습니다</Text>
        </View>
      </View>
    );
  }

  const total = data.reduce((sum, item) => sum + item.value, 0);
  const colors = [Colors.primary, Colors.success, Colors.warning, Colors.danger, Colors.info];

  return (
    <View style={styles.chartContainer}>
      <Text style={styles.chartTitle}>{title}</Text>
      <View style={styles.pieChartContainer}>
        {/* 막대 차트 방식으로 표시 */}
        <View style={styles.categoryBars}>
          {data.map((item, index) => {
            const color = colors[index % colors.length];
            const percentage = total > 0 ? (item.value / total) * 100 : 0;
            return (
              <View key={index} style={styles.categoryBarItem}>
                <View style={styles.categoryBarContainer}>
                  <View
                    style={[
                      styles.categoryBar,
                      {
                        width: `${percentage}%`,
                        backgroundColor: color,
                      },
                    ]}
                  />
                </View>
                <View style={styles.categoryBarInfo}>
                  <View style={styles.categoryBarLabel}>
                    <View style={[styles.categoryBarColor, { backgroundColor: color }]} />
                    <Text style={styles.categoryBarText}>{item.label}</Text>
                  </View>
                  <Text style={styles.categoryBarValue}>
                    {item.value}개 ({percentage.toFixed(0)}%)
                  </Text>
                </View>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
};

// 라인 차트 컴포넌트 (간단한 버전)
export const LineChart = ({ data, title, height = 200, lineColor = Colors.primary }) => {
  if (!data || data.length < 2) {
    return (
      <View style={[styles.chartContainer, { height }]}>
        <Text style={styles.chartTitle}>{title}</Text>
        <View style={styles.emptyChart}>
          <Text style={styles.emptyText}>데이터가 부족합니다</Text>
        </View>
      </View>
    );
  }

  const maxValue = Math.max(...data.map(item => item.value));
  const minValue = Math.min(...data.map(item => item.value));
  const valueRange = maxValue - minValue;
  const chartWidth = width - Theme.spacing.md * 2 - 60;
  const chartHeight = height - 80;

  const points = data.map((item, index) => {
    const x = (index / (data.length - 1)) * chartWidth;
    const y = valueRange > 0 
      ? chartHeight - ((item.value - minValue) / valueRange) * chartHeight
      : chartHeight / 2;
    return { x, y, value: item.value };
  });

  return (
    <View style={[styles.chartContainer, { height }]}>
      <Text style={styles.chartTitle}>{title}</Text>
      <View style={styles.lineChartContainer}>
        <View style={styles.lineChart}>
          {points.map((point, index) => (
            <View key={index}>
              <View
                style={[
                  styles.linePoint,
                  {
                    left: point.x,
                    top: point.y,
                    backgroundColor: lineColor,
                  },
                ]}
              />
              {index > 0 && (
                <View
                  style={[
                    styles.lineSegment,
                    {
                      left: points[index - 1].x,
                      top: points[index - 1].y,
                      width: point.x - points[index - 1].x,
                      height: 2,
                      backgroundColor: lineColor,
                      transform: [
                        {
                          rotate: `${Math.atan2(
                            point.y - points[index - 1].y,
                            point.x - points[index - 1].x
                          )}rad`,
                        },
                      ],
                    },
                  ]}
                />
              )}
            </View>
          ))}
        </View>
        <View style={styles.lineLabels}>
          {data.map((item, index) => (
            <Text key={index} style={styles.lineLabel}>
              {item.label}
            </Text>
          ))}
        </View>
      </View>
    </View>
  );
};

// 통계 카드 컴포넌트 (간단한 버전)
export const StatCard = ({ title, value, subtitle, color = Colors.primary }) => {
  return (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <Text style={styles.statTitle}>{title}</Text>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      {subtitle && <Text style={styles.statSubtitle}>{subtitle}</Text>}
    </View>
  );
};

// 통계 섹션 컴포넌트
export const StatSection = ({ title, children }) => {
  return (
    <View style={styles.statSection}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  // 차트 컨테이너
  chartContainer: {
    backgroundColor: Colors.surface,
    borderRadius: Theme.borderRadius.md,
    padding: Theme.spacing.md,
    marginBottom: Theme.spacing.md,
    ...Theme.shadows.small,
  },
  chartTitle: {
    fontSize: Theme.typography.h4.fontSize,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: Theme.spacing.md,
    textAlign: 'center',
  },
  chartContent: {
    flex: 1,
    justifyContent: 'center',
  },
  emptyChart: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: Colors.textSecondary,
    fontSize: Theme.typography.body.fontSize,
  },

  // 막대 차트
  barsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'flex-end',
    height: '100%',
  },
  barItem: {
    alignItems: 'center',
    flex: 1,
  },
  barContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    marginBottom: Theme.spacing.xs,
  },
  bar: {
    width: 24,
    borderRadius: 4,
    minHeight: 4,
  },
  barLabel: {
    fontSize: Theme.typography.small.fontSize,
    color: Colors.textSecondary,
    textAlign: 'center',
    fontWeight: '500',
    marginTop: Theme.spacing.sm,
  },
  barValue: {
    fontSize: Theme.typography.small.fontSize,
    color: Colors.textPrimary,
    fontWeight: '700',
    marginTop: Theme.spacing.xs,
  },

  // 카테고리 막대 차트
  pieChartContainer: {
    width: '100%',
  },
  categoryBars: {
    width: '100%',
  },
  categoryBarItem: {
    marginBottom: Theme.spacing.md,
  },
  categoryBarContainer: {
    height: 12,
    backgroundColor: Colors.border,
    borderRadius: 6,
    marginBottom: Theme.spacing.sm,
    overflow: 'hidden',
    ...Theme.shadows.small,
  },
  categoryBar: {
    height: '100%',
    borderRadius: 6,
    ...Theme.shadows.small,
  },
  categoryBarInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryBarLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryBarColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: Theme.spacing.sm,
  },
  categoryBarText: {
    fontSize: Theme.typography.body.fontSize,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  categoryBarValue: {
    fontSize: Theme.typography.small.fontSize,
    color: Colors.textSecondary,
    fontWeight: '600',
  },

  // 라인 차트
  lineChartContainer: {
    flex: 1,
  },
  lineChart: {
    flex: 1,
    position: 'relative',
  },
  linePoint: {
    position: 'absolute',
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: -4,
    marginTop: -4,
  },
  lineSegment: {
    position: 'absolute',
    transformOrigin: 'left center',
  },
  lineLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Theme.spacing.sm,
  },
  lineLabel: {
    fontSize: Theme.typography.small.fontSize,
    color: Colors.textSecondary,
  },

  // 통계 카드
  statCard: {
    backgroundColor: Colors.surface,
    borderRadius: Theme.borderRadius.md,
    padding: Theme.spacing.md,
    marginBottom: Theme.spacing.sm,
    borderLeftWidth: 4,
    ...Theme.shadows.small,
  },
  statTitle: {
    fontSize: Theme.typography.body.fontSize,
    color: Colors.textSecondary,
    marginBottom: Theme.spacing.xs,
  },
  statValue: {
    fontSize: Theme.typography.h2.fontSize,
    fontWeight: '700',
    marginBottom: Theme.spacing.xs,
  },
  statSubtitle: {
    fontSize: Theme.typography.small.fontSize,
    color: Colors.textSecondary,
  },

  // 통계 섹션
  statSection: {
    marginBottom: Theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: Theme.typography.h3.fontSize,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: Theme.spacing.md,
  },
});
