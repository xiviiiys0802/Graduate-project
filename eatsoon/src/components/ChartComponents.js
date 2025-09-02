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
            const barHeight = maxValue > 0 ? (item.value / maxValue) * (height - 80) : 0;
            return (
              <View key={index} style={styles.barItem}>
                <View style={styles.barContainer}>
                  <View
                    style={[
                      styles.bar,
                      {
                        height: barHeight,
                        backgroundColor: barColor,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.barLabel}>{item.label}</Text>
                <Text style={styles.barValue}>{item.value}</Text>
              </View>
            );
          })}
        </View>
      </View>
    </View>
  );
};

// 원형 차트 컴포넌트
export const PieChart = ({ data, title, size = 150 }) => {
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
        <View style={[styles.pieChart, { width: size, height: size }]}>
          {data.map((item, index) => {
            const percentage = total > 0 ? (item.value / total) * 100 : 0;
            const color = colors[index % colors.length];
            
            return (
              <View key={index} style={styles.pieSlice}>
                <View
                  style={[
                    styles.pieSliceInner,
                    {
                      backgroundColor: color,
                      width: `${percentage}%`,
                    },
                  ]}
                />
              </View>
            );
          })}
        </View>
        <View style={styles.legendContainer}>
          {data.map((item, index) => {
            const color = colors[index % colors.length];
            return (
              <View key={index} style={styles.legendItem}>
                <View style={[styles.legendColor, { backgroundColor: color }]} />
                <Text style={styles.legendText}>{item.label}</Text>
                <Text style={styles.legendValue}>{item.value}</Text>
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

// 통계 카드 컴포넌트
export const StatCard = ({ title, value, subtitle, icon, color = Colors.primary }) => {
  return (
    <View style={[styles.statCard, { borderLeftColor: color }]}>
      <View style={styles.statHeader}>
        <Text style={styles.statTitle}>{title}</Text>
        {icon && (
          <View style={[styles.statIcon, { backgroundColor: color + '20' }]}>
            {icon}
          </View>
        )}
      </View>
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
    width: 20,
    borderRadius: 2,
    minHeight: 4,
  },
  barLabel: {
    fontSize: Theme.typography.small.fontSize,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  barValue: {
    fontSize: Theme.typography.small.fontSize,
    color: Colors.textPrimary,
    fontWeight: '600',
    marginTop: Theme.spacing.xs,
  },

  // 원형 차트
  pieChartContainer: {
    alignItems: 'center',
  },
  pieChart: {
    borderRadius: 75,
    overflow: 'hidden',
    marginBottom: Theme.spacing.md,
  },
  pieSlice: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  pieSliceInner: {
    height: '100%',
  },
  legendContainer: {
    width: '100%',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Theme.spacing.xs,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: Theme.spacing.xs,
  },
  legendText: {
    flex: 1,
    fontSize: Theme.typography.small.fontSize,
    color: Colors.textPrimary,
  },
  legendValue: {
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
  statHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Theme.spacing.sm,
  },
  statTitle: {
    fontSize: Theme.typography.body.fontSize,
    color: Colors.textSecondary,
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
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
