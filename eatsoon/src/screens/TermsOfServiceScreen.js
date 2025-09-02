// src/screens/TermsOfServiceScreen.js
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

export default function TermsOfServiceScreen() {
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
        <Text style={styles.headerTitle}>이용약관</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>제1조 (목적)</Text>
          <Text style={styles.text}>
            이 약관은 EatSoon(이하 "회사")이 제공하는 식품 관리 서비스(이하 "서비스")의 이용과 관련하여 회사와 이용자 간의 권리, 의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>제2조 (정의)</Text>
          <Text style={styles.text}>
            1. "서비스"란 회사가 제공하는 식품 관리, 유통기한 알림, 재고 관리 등의 서비스를 의미합니다.{'\n'}
            2. "이용자"란 이 약관에 따라 회사와 이용계약을 체결하고 회사가 제공하는 서비스를 이용하는 자를 의미합니다.{'\n'}
            3. "계정"이란 이용자의 식별과 서비스 이용을 위하여 이용자가 선정하고 회사가 승인하는 문자, 숫자 또는 특수문자의 조합을 의미합니다.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>제3조 (약관의 효력 및 변경)</Text>
          <Text style={styles.text}>
            1. 이 약관은 서비스 화면에 게시하거나 기타의 방법으로 이용자에게 공지함으로써 효력이 발생합니다.{'\n'}
            2. 회사는 필요한 경우 관련법령을 위배하지 않는 범위에서 이 약관을 변경할 수 있습니다.{'\n'}
            3. 약관이 변경되는 경우, 회사는 변경사항을 시행일자 7일 전부터 공지사항을 통해 공지합니다.{'\n'}
            4. 이용자가 변경된 약관에 동의하지 않는 경우, 서비스 이용을 중단하고 탈퇴할 수 있습니다.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>제4조 (서비스의 제공)</Text>
          <Text style={styles.text}>
            1. 회사는 다음과 같은 서비스를 제공합니다:{'\n'}
            • 식품 정보 등록 및 관리{'\n'}
            • 유통기한 알림 서비스{'\n'}
            • 재고 관리 서비스{'\n'}
            • 사용 통계 및 분석{'\n'}
            • 기타 회사가 정하는 서비스{'\n'}
            2. 서비스는 연중무휴, 1일 24시간 제공함을 원칙으로 합니다.{'\n'}
            3. 회사는 서비스의 제공에 필요한 경우 정기점검을 실시할 수 있으며, 정기점검시간은 서비스제공화면에 공지한 바에 따릅니다.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>제5조 (서비스의 중단)</Text>
          <Text style={styles.text}>
            1. 회사는 컴퓨터 등 정보통신설비의 보수점검, 교체 및 고장, 통신의 두절 등의 사유가 발생한 경우에는 서비스의 제공을 일시적으로 중단할 수 있습니다.{'\n'}
            2. 제1항에 의한 서비스 중단의 경우에는 회사는 제8조에 정한 방법으로 이용자에게 통지합니다.{'\n'}
            3. 회사는 제1항의 사유로 서비스의 제공이 일시적으로 중단됨으로 인하여 이용자 또는 제3자가 입은 손해에 대하여 배상합니다. 단, 회사가 고의 또는 과실이 없음을 입증하는 경우에는 그러하지 아니합니다.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>제6조 (이용계약의 체결)</Text>
          <Text style={styles.text}>
            1. 이용계약은 이용자가 약관의 내용에 대하여 동의를 한 다음 회원가입신청을 하고 회사가 이러한 신청에 대하여 승낙함으로써 체결됩니다.{'\n'}
            2. 회사는 다음 각 호에 해당하는 신청에 대하여는 승낙을 하지 않을 수 있습니다:{'\n'}
            • 기술상 서비스 제공이 불가능한 경우{'\n'}
            • 실명이 아니거나 타인의 명의를 이용한 경우{'\n'}
            • 허위의 정보를 기재하거나 회사가 요구하는 내용을 기재하지 않은 경우{'\n'}
            • 이용자의 귀책사유로 인증이 불가능한 경우{'\n'}
            • 이미 가입된 회원과 정보가 동일한 경우
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>제7조 (개인정보보호)</Text>
          <Text style={styles.text}>
            1. 회사는 관련법령이 정하는 바에 따라 이용자의 개인정보를 보호하기 위해 노력합니다.{'\n'}
            2. 개인정보의 보호 및 사용에 대해서는 관련법령 및 회사의 개인정보처리방침이 적용됩니다.{'\n'}
            3. 회사는 이용자의 개인정보를 원칙적으로 외부에 제공하지 않습니다. 단, 이용자의 사전 동의가 있거나 관련법령에 의거해 법적 절차에 따라 요구되는 경우에는 그러하지 아니합니다.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>제8조 (회사의 의무)</Text>
          <Text style={styles.text}>
            1. 회사는 관련법령과 이 약관이 금지하거나 공서양속에 반하는 행위를 하지 않으며 이 약관이 정하는 바에 따라 지속적이고, 안정적으로 서비스를 제공하기 위하여 노력합니다.{'\n'}
            2. 회사는 이용자가 안전하게 인터넷 서비스를 이용할 수 있도록 이용자의 개인정보(신용정보 포함) 보호를 위한 보안 시스템을 구축합니다.{'\n'}
            3. 회사는 서비스 이용과 관련하여 이용자로부터 제기된 의견이나 불만이 정당하다고 객관적으로 인정될 경우에는 적절한 절차를 거쳐 즉시 처리하여야 합니다. 다만, 즉시 처리가 곤란한 경우에는 이용자에게 그 사유와 처리일정을 통지하여야 합니다.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>제9조 (이용자의 의무)</Text>
          <Text style={styles.text}>
            1. 이용자는 다음 행위를 하여서는 안 됩니다:{'\n'}
            • 신청 또는 변경 시 허위내용의 등록{'\n'}
            • 타인의 정보 도용{'\n'}
            • 회사가 게시한 정보의 변경{'\n'}
            • 회사가 정한 정보 이외의 정보(컴퓨터 프로그램 등) 등의 송신 또는 게시{'\n'}
            • 회사 기타 제3자의 저작권 등 지적재산권에 대한 침해{'\n'}
            • 회사 기타 제3자의 명예를 손상시키거나 업무를 방해하는 행위{'\n'}
            • 외설 또는 폭력적인 메시지, 화상, 음성, 기타 공서양속에 반하는 정보를 서비스에 공개 또는 게시하는 행위{'\n'}
            2. 이용자는 관계법령, 이 약관의 규정, 이용안내 및 서비스상에 공지한 주의사항, 회사가 통지하는 사항 등을 준수하여야 하며, 기타 회사의 업무에 방해가 되는 행위를 하여서는 안 됩니다.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>제10조 (서비스 이용제한)</Text>
          <Text style={styles.text}>
            1. 회사는 이용자가 이 약관의 의무를 위반하거나 서비스의 정상적인 운영을 방해한 경우, 경고, 일시정지, 영구이용정지 등으로 서비스 이용을 단계적으로 제한할 수 있습니다.{'\n'}
            2. 회사는 전항에도 불구하고, "주민등록법"을 위반한 명의도용 및 결제도용, "저작권법" 및 "컴퓨터프로그램보호법"을 위반한 불법프로그램의 제공 및 운영방해, "정보통신망 이용촉진 및 정보보호 등에 관한 법률"을 위반한 불법통신 및 해킹, 악성프로그램의 배포, 접속권한 초과행위 등과 같이 관련법을 위반한 경우에는 즉시 영구이용정지를 할 수 있습니다.{'\n'}
            3. 회사는 회원이 1년 이상 서비스 이용기록이 없는 경우, 회원정보의 보호 및 운영의 효율성을 위해 이용을 제한할 수 있습니다.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>제11조 (책임제한)</Text>
          <Text style={styles.text}>
            1. 회사는 천재지변 또는 이에 준하는 불가항력으로 인하여 서비스를 제공할 수 없는 경우에는 서비스 제공에 관한 책임이 면제됩니다.{'\n'}
            2. 회사는 이용자의 귀책사유로 인한 서비스 이용의 장애에 대하여는 책임을 지지 않습니다.{'\n'}
            3. 회사는 이용자가 서비스를 이용하여 기대하는 수익을 상실한 것에 대하여 책임을 지지 않으며, 그 밖의 서비스를 통하여 얻은 자료로 인한 손해에 관하여 책임을 지지 않습니다.{'\n'}
            4. 회사는 이용자가 서비스에 게재한 정보, 자료, 사실의 신뢰도, 정확성 등 내용에 관해 책임을 지지 않습니다.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>제12조 (분쟁해결)</Text>
          <Text style={styles.text}>
            1. 회사는 이용자가 제기하는 정당한 의견이나 불만을 반영하고 그 피해를 보상처리하기 위하여 피해보상처리기구를 설치·운영합니다.{'\n'}
            2. 회사와 이용자 간에 발생한 전자상거래 분쟁에 관하여는 소비자분쟁조정위원회의 조정에 따를 수 있습니다.{'\n'}
            3. 회사와 이용자 간에 서비스 이용으로 발생한 분쟁에 대해 소송이 제기될 경우 회사의 본사 소재지를 관할하는 법원을 전속관할법원으로 합니다.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>제13조 (재판권 및 준거법)</Text>
          <Text style={styles.text}>
            1. 회사와 이용자 간에 발생한 분쟁에 관한 소송은 제소 당시의 이용자의 주소에 의하고, 주소가 없는 경우에는 거소를 관할하는 지방법원의 전속관할로 합니다. 다만, 제소 당시 이용자의 주소 또는 거소가 명확하지 아니한 경우에는 민사소송법에 따라 관할법원을 정합니다.{'\n'}
            2. 회사와 이용자 간에 제기된 소송에는 대한민국법을 적용합니다.
          </Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            본 약관은 2024년 1월 1일부터 시행됩니다.
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
