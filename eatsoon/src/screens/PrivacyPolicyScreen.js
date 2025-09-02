// src/screens/PrivacyPolicyScreen.js
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

export default function PrivacyPolicyScreen() {
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
        <Text style={styles.headerTitle}>개인정보 처리방침</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. 개인정보의 처리 목적</Text>
          <Text style={styles.text}>
            EatSoon은 다음의 목적을 위하여 개인정보를 처리하고 있으며, 다음의 목적 이외의 용도로는 이용하지 않습니다.
          </Text>
          <Text style={styles.text}>
            • 식품 관리 서비스 제공{'\n'}
            • 유통기한 알림 서비스{'\n'}
            • 재고 관리 서비스{'\n'}
            • 사용자 맞춤 서비스 제공{'\n'}
            • 서비스 개선 및 신규 서비스 개발{'\n'}
            • 고객 상담 및 문의 응대
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. 개인정보의 처리 및 보유기간</Text>
          <Text style={styles.text}>
            EatSoon은 법령에 따른 개인정보 보유·이용기간 또는 정보주체로부터 개인정보를 수집 시에 동의받은 개인정보 보유·이용기간 내에서 개인정보를 처리·보유합니다.
          </Text>
          <Text style={styles.text}>
            • 회원가입 및 관리: 서비스 이용계약 또는 회원가입 해지시까지{'\n'}
            • 식품 정보 관리: 서비스 이용 종료시까지{'\n'}
            • 알림 서비스: 서비스 이용 종료시까지{'\n'}
            • 통계 및 분석: 익명화 처리 후 영구 보관
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. 개인정보의 제3자 제공</Text>
          <Text style={styles.text}>
            EatSoon은 정보주체의 개인정보를 제1조(개인정보의 처리 목적)에서 명시한 범위 내에서만 처리하며, 정보주체의 동의, 법률의 특별한 규정 등 개인정보보호법 제17조 및 제18조에 해당하는 경우에만 개인정보를 제3자에게 제공합니다.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. 개인정보처리의 위탁</Text>
          <Text style={styles.text}>
            EatSoon은 원활한 개인정보 업무처리를 위하여 다음과 같이 개인정보 처리업무를 위탁하고 있습니다.
          </Text>
          <Text style={styles.text}>
            • 위탁받는 자 (수탁자): Firebase (Google){'\n'}
            • 위탁하는 업무의 내용: 사용자 인증, 데이터 저장{'\n'}
            • 위탁기간: 서비스 이용 종료시까지
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. 정보주체의 권리·의무 및 그 행사방법</Text>
          <Text style={styles.text}>
            이용자는 개인정보주체로서 다음과 같은 권리를 행사할 수 있습니다.
          </Text>
          <Text style={styles.text}>
            • 개인정보 열람요구{'\n'}
            • 오류 등이 있을 경우 정정 요구{'\n'}
            • 삭제요구{'\n'}
            • 처리정지 요구
          </Text>
          <Text style={styles.text}>
            제1항에 따른 권리 행사는 개인정보보호법 시행령 제41조제1항에 따라 서면, 전자우편, 모사전송(FAX) 등을 통하여 하실 수 있으며, EatSoon은 이에 대해 지체없이 조치하겠습니다.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6. 처리하는 개인정보의 항목</Text>
          <Text style={styles.text}>
            EatSoon은 다음의 개인정보 항목을 처리하고 있습니다.
          </Text>
          <Text style={styles.text}>
            • 필수항목: 이메일 주소, 비밀번호{'\n'}
            • 선택항목: 사용자 이름, 프로필 사진{'\n'}
            • 자동수집항목: IP 주소, 쿠키, 서비스 이용 기록, 접속 로그
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>7. 개인정보의 파기</Text>
          <Text style={styles.text}>
            EatSoon은 개인정보 보유기간의 경과, 처리목적 달성 등 개인정보가 불필요하게 되었을 때에는 지체없이 해당 개인정보를 파기합니다.
          </Text>
          <Text style={styles.text}>
            • 전자적 파일 형태의 정보: 기록을 재생할 수 없는 기술적 방법을 사용하여 삭제{'\n'}
            • 종이에 출력된 개인정보: 분쇄기로 분쇄하거나 소각을 통하여 파기
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>8. 개인정보의 안전성 확보 조치</Text>
          <Text style={styles.text}>
            EatSoon은 개인정보보호법 제29조에 따라 다음과 같은 안전성 확보 조치를 취하고 있습니다.
          </Text>
          <Text style={styles.text}>
            • 개인정보의 암호화{'\n'}
            • 해킹 등에 대비한 기술적 대책{'\n'}
            • 개인정보에 대한 접근 제한{'\n'}
            • 개인정보를 다루는 직원의 최소화 및 교육
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>9. 개인정보 보호책임자</Text>
          <Text style={styles.text}>
            EatSoon은 개인정보 처리에 관한 업무를 총괄해서 책임지고, 개인정보 처리와 관련한 정보주체의 불만처리 및 피해구제 등을 위하여 아래와 같이 개인정보 보호책임자를 지정하고 있습니다.
          </Text>
          <Text style={styles.text}>
            ▶ 개인정보 보호책임자{'\n'}
            • 성명: 개발팀{'\n'}
            • 직책: 개발자{'\n'}
            • 연락처: support@eatsoon.com{'\n'}
            • 이메일: support@eatsoon.com
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>10. 개인정보 처리방침 변경</Text>
          <Text style={styles.text}>
            이 개인정보처리방침은 시행일로부터 적용되며, 법령 및 방침에 따른 변경내용의 추가, 삭제 및 정정이 있는 경우에는 변경사항의 시행 7일 전부터 공지사항을 통하여 고지할 것입니다.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>11. 권익침해 구제방법</Text>
          <Text style={styles.text}>
            정보주체는 개인정보침해로 인한 구제를 받기 위하여 개인정보분쟁조정위원회, 개인정보보호위원회에 분쟁해결이나 상담 등을 신청할 수 있습니다.
          </Text>
          <Text style={styles.text}>
            • 개인정보분쟁조정위원회: 1833-6972{'\n'}
            • 개인정보보호위원회: 1833-6972{'\n'}
            • 대검찰청 사이버범죄수사단: 02-3480-3573{'\n'}
            • 경찰청 사이버안전국: 182
          </Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            본 방침은 2024년 1월 1일부터 시행됩니다.
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
    marginBottom: Theme.spacing.lg,
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
    marginBottom: Theme.spacing.sm,
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
    fontStyle: 'italic',
  },
});
