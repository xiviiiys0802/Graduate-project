// src/screens/HelpScreen.js
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Theme } from '../utils/colors';
import { Container } from '../components/StyledComponents';

export default function HelpScreen() {
  const navigation = useNavigation();

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
        <Text style={styles.headerTitle}>도움말</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.content}>
        {/* 시작하기 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🚀 시작하기</Text>
          <Text style={styles.text}>
            EatSoon은 식품 관리와 유통기한 알림을 도와주는 앱입니다. 처음 사용하시는 분들을 위한 기본 가이드입니다.
          </Text>
        </View>

        {/* 홈 화면 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🏠 홈 화면</Text>
          <Text style={styles.text}>
            홈 화면에서는 등록된 모든 식품을 확인할 수 있습니다.
          </Text>
          <View style={styles.featureList}>
            <View style={styles.featureItem}>
              <Ionicons name="add-circle" size={20} color={Colors.primary} />
              <Text style={styles.featureText}>+ 버튼: 새로운 식품 추가</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="search" size={20} color={Colors.info} />
              <Text style={styles.featureText}>검색: 식품명으로 빠른 검색</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="filter" size={20} color={Colors.warning} />
              <Text style={styles.featureText}>필터: 카테고리별 정렬</Text>
            </View>
          </View>
        </View>

        {/* 식품 추가 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>➕ 식품 추가하기</Text>
          <Text style={styles.text}>
            새로운 식품을 등록하는 방법을 알아보세요.
          </Text>
          <View style={styles.stepList}>
            <View style={styles.stepItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>
              <Text style={styles.stepText}>홈 화면의 + 버튼을 터치합니다</Text>
            </View>
            <View style={styles.stepItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <Text style={styles.stepText}>식품명을 입력합니다</Text>
            </View>
            <View style={styles.stepItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>3</Text>
              </View>
              <Text style={styles.stepText}>카테고리를 선택합니다</Text>
            </View>
            <View style={styles.stepItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>4</Text>
              </View>
              <Text style={styles.stepText}>유통기한을 설정합니다</Text>
            </View>
            <View style={styles.stepItem}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>5</Text>
              </View>
              <Text style={styles.stepText}>저장 버튼을 터치합니다</Text>
            </View>
          </View>
        </View>

        {/* 음성 인식 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🎤 음성 인식 기능</Text>
          <Text style={styles.text}>
            마이크 버튼을 사용하면 음성으로 식품 정보를 빠르게 입력할 수 있습니다.
          </Text>
          <View style={styles.tipBox}>
            <Text style={styles.tipTitle}>💡 사용 팁</Text>
            <Text style={styles.tipText}>
              "우유 1개 유통기한 3일 후"와 같이 말하면 자동으로 정보가 입력됩니다.
            </Text>
          </View>
        </View>

        {/* 알림 설정 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🔔 알림 설정</Text>
          <Text style={styles.text}>
            유통기한 알림을 받으려면 알림 설정을 활성화해야 합니다.
          </Text>
          <View style={styles.featureList}>
            <View style={styles.featureItem}>
              <Ionicons name="time" size={20} color={Colors.danger} />
              <Text style={styles.featureText}>유통기한 알림: 설정한 시간에 알림</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="notifications" size={20} color={Colors.warning} />
              <Text style={styles.featureText}>재고 알림: 수량이 부족할 때 알림</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="calendar" size={20} color={Colors.info} />
              <Text style={styles.featureText}>정기 알림: 매일 정해진 시간에 알림</Text>
            </View>
          </View>
        </View>

        {/* 마이페이지 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>👤 마이페이지</Text>
          <Text style={styles.text}>
            마이페이지에서는 다양한 설정과 정보를 확인할 수 있습니다.
          </Text>
          <View style={styles.featureList}>
            <View style={styles.featureItem}>
              <Ionicons name="analytics" size={20} color={Colors.primary} />
              <Text style={styles.featureText}>사용 통계: 앱 사용 현황 확인</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="time" size={20} color={Colors.info} />
              <Text style={styles.featureText}>알림 히스토리: 받은 알림 기록</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="person" size={20} color={Colors.warning} />
              <Text style={styles.featureText}>프로필 편집: 개인정보 수정</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="shield-checkmark" size={20} color={Colors.success} />
              <Text style={styles.featureText}>개인정보 보호: 데이터 관리</Text>
            </View>
          </View>
        </View>

        {/* 더보기 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📋 더보기</Text>
          <Text style={styles.text}>
            더보기 탭에서는 추가 기능들을 확인할 수 있습니다.
          </Text>
          <View style={styles.featureList}>
            <View style={styles.featureItem}>
              <Ionicons name="restaurant" size={20} color={Colors.primary} />
              <Text style={styles.featureText}>레시피 추천: 남은 재료로 가능한 요리</Text>
            </View>
            <View style={styles.featureItem}>
              <Ionicons name="cart" size={20} color={Colors.success} />
              <Text style={styles.featureText}>장보기 리스트: 부족한 재료 관리</Text>
            </View>
          </View>
        </View>

        {/* 자주 묻는 질문 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>❓ 자주 묻는 질문</Text>
          
          <View style={styles.faqItem}>
            <Text style={styles.faqQuestion}>Q: 알림이 오지 않아요</Text>
            <Text style={styles.faqAnswer}>
              A: 설정 → 알림 설정에서 알림을 활성화하고, 앱 알림 권한을 확인해주세요.
            </Text>
          </View>
          
          <View style={styles.faqItem}>
            <Text style={styles.faqQuestion}>Q: 식품을 삭제하려면 어떻게 해요?</Text>
            <Text style={styles.faqAnswer}>
              A: 홈 화면에서 식품을 왼쪽으로 스와이프하면 삭제 버튼이 나타납니다.
            </Text>
          </View>
          
          <View style={styles.faqItem}>
            <Text style={styles.faqQuestion}>Q: 음성 인식이 잘 안 돼요</Text>
            <Text style={styles.faqAnswer}>
              A: 조용한 환경에서 명확하게 말씀해주시고, 마이크 권한을 확인해주세요.
            </Text>
          </View>
          
          <View style={styles.faqItem}>
            <Text style={styles.faqQuestion}>Q: 데이터를 백업할 수 있나요?</Text>
            <Text style={styles.faqAnswer}>
              A: 마이페이지 → 개인정보 보호 → 데이터 내보내기에서 가능합니다.
            </Text>
          </View>
        </View>

        {/* 연락처 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📞 문의 및 지원</Text>
          <Text style={styles.text}>
            추가 도움이 필요하시면 언제든 연락해주세요.
          </Text>
          <View style={styles.contactBox}>
            <View style={styles.contactItem}>
              <Ionicons name="mail" size={20} color={Colors.primary} />
              <Text style={styles.contactText}>이메일: support@eatsoon.com</Text>
            </View>
            <View style={styles.contactItem}>
              <Ionicons name="document-text" size={20} color={Colors.info} />
              <Text style={styles.contactText}>개인정보 처리방침: 마이페이지에서 확인</Text>
            </View>
            <View style={styles.contactItem}>
              <Ionicons name="document" size={20} color={Colors.warning} />
              <Text style={styles.contactText}>이용약관: 마이페이지에서 확인</Text>
            </View>
          </View>
        </View>

        {/* 버전 정보 */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            EatSoon v1.0.0 - 식품 관리 앱{'\n'}
            © 2024 Graduate Project
          </Text>
        </View>
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

  // 콘텐츠
  content: {
    flex: 1,
    paddingHorizontal: Theme.spacing.md,
  },

  // 섹션
  section: {
    marginBottom: Theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: Theme.typography.h4.fontSize,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: Theme.spacing.sm,
  },
  text: {
    fontSize: Theme.typography.body.fontSize,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginBottom: Theme.spacing.md,
  },

  // 기능 리스트
  featureList: {
    marginTop: Theme.spacing.sm,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Theme.spacing.sm,
  },
  featureText: {
    fontSize: Theme.typography.body.fontSize,
    color: Colors.textSecondary,
    marginLeft: Theme.spacing.sm,
    flex: 1,
  },

  // 단계 리스트
  stepList: {
    marginTop: Theme.spacing.sm,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Theme.spacing.md,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Theme.spacing.sm,
  },
  stepNumberText: {
    fontSize: Theme.typography.small.fontSize,
    fontWeight: '600',
    color: Colors.white,
  },
  stepText: {
    fontSize: Theme.typography.body.fontSize,
    color: Colors.textSecondary,
    flex: 1,
  },

  // 팁 박스
  tipBox: {
    backgroundColor: Colors.info + '10',
    borderColor: Colors.info + '30',
    borderWidth: 1,
    borderRadius: Theme.borderRadius.md,
    padding: Theme.spacing.md,
    marginTop: Theme.spacing.sm,
  },
  tipTitle: {
    fontSize: Theme.typography.body.fontSize,
    fontWeight: '600',
    color: Colors.info,
    marginBottom: Theme.spacing.xs,
  },
  tipText: {
    fontSize: Theme.typography.small.fontSize,
    color: Colors.textSecondary,
    lineHeight: 18,
  },

  // FAQ
  faqItem: {
    marginBottom: Theme.spacing.lg,
  },
  faqQuestion: {
    fontSize: Theme.typography.body.fontSize,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: Theme.spacing.xs,
  },
  faqAnswer: {
    fontSize: Theme.typography.body.fontSize,
    color: Colors.textSecondary,
    lineHeight: 20,
  },

  // 연락처
  contactBox: {
    backgroundColor: Colors.surface,
    borderRadius: Theme.borderRadius.md,
    padding: Theme.spacing.md,
    marginTop: Theme.spacing.sm,
  },
  contactItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Theme.spacing.sm,
  },
  contactText: {
    fontSize: Theme.typography.body.fontSize,
    color: Colors.textSecondary,
    marginLeft: Theme.spacing.sm,
    flex: 1,
  },

  // 푸터
  footer: {
    marginTop: Theme.spacing.xl,
    marginBottom: Theme.spacing.xl,
    paddingTop: Theme.spacing.lg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  footerText: {
    fontSize: Theme.typography.small.fontSize,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
});
