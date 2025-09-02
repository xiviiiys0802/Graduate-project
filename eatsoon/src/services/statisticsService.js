import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAuth } from 'firebase/auth';

const STATISTICS_KEY = 'user_statistics';

// 통계 데이터 구조
const defaultStatistics = {
  totalFoodItems: 0,
  expiredItems: 0,
  expiringSoonItems: 0,
  notificationsSent: 0,
  notificationsReceived: 0,
  weeklyStats: {
    foodAdded: 0,
    foodConsumed: 0,
    notificationsSent: 0,
  },
  monthlyStats: {
    foodAdded: 0,
    foodConsumed: 0,
    notificationsSent: 0,
    mostAddedCategory: '',
  },
  categories: {
    dairy: 0,
    meat: 0,
    vegetables: 0,
    fruits: 0,
    grains: 0,
    beverages: 0,
    snacks: 0,
    others: 0,
  },
  lastUpdated: null,
};

class StatisticsService {
  // 사용자별 통계 키 생성
  getStatisticsKey(userId) {
    return `${STATISTICS_KEY}_${userId}`;
  }

  // 통계 데이터 로드
  async loadStatistics() {
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      
      if (!user) {
        console.log('사용자가 로그인되지 않았습니다.');
        return defaultStatistics;
      }

      const key = this.getStatisticsKey(user.uid);
      const data = await AsyncStorage.getItem(key);
      
      if (data) {
        const statistics = JSON.parse(data);
        // 기본값과 병합하여 누락된 필드가 있으면 기본값으로 설정
        return { ...defaultStatistics, ...statistics };
      }
      
      return defaultStatistics;
    } catch (error) {
      console.error('통계 데이터 로드 실패:', error);
      return defaultStatistics;
    }
  }

  // 통계 데이터 저장
  async saveStatistics(statistics) {
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      
      if (!user) {
        console.log('사용자가 로그인되지 않았습니다.');
        return false;
      }

      const key = this.getStatisticsKey(user.uid);
      const dataToSave = {
        ...statistics,
        lastUpdated: new Date().toISOString(),
      };
      
      await AsyncStorage.setItem(key, JSON.stringify(dataToSave));
      return true;
    } catch (error) {
      console.error('통계 데이터 저장 실패:', error);
      return false;
    }
  }

  // 음식 아이템 추가 시 통계 업데이트
  async addFoodItem(category = 'others') {
    try {
      const statistics = await this.loadStatistics();
      
      statistics.totalFoodItems += 1;
      statistics.weeklyStats.foodAdded += 1;
      statistics.monthlyStats.foodAdded += 1;
      
      // 카테고리별 통계 업데이트
      if (statistics.categories[category] !== undefined) {
        statistics.categories[category] += 1;
      } else {
        statistics.categories.others += 1;
      }
      
      // 가장 많이 추가된 카테고리 업데이트
      const categories = Object.entries(statistics.categories);
      const mostAdded = categories.reduce((a, b) => 
        statistics.categories[a[0]] > statistics.categories[b[0]] ? a : b
      );
      statistics.monthlyStats.mostAddedCategory = mostAdded[0];
      
      await this.saveStatistics(statistics);
      return true;
    } catch (error) {
      console.error('음식 아이템 추가 통계 업데이트 실패:', error);
      return false;
    }
  }

  // 음식 아이템 삭제 시 통계 업데이트
  async removeFoodItem(category = 'others') {
    try {
      const statistics = await this.loadStatistics();
      
      if (statistics.totalFoodItems > 0) {
        statistics.totalFoodItems -= 1;
      }
      
      if (statistics.categories[category] > 0) {
        statistics.categories[category] -= 1;
      }
      
      await this.saveStatistics(statistics);
      return true;
    } catch (error) {
      console.error('음식 아이템 삭제 통계 업데이트 실패:', error);
      return false;
    }
  }

  // 유통기한 임박 아이템 수 업데이트
  async updateExpiringItems(count) {
    try {
      const statistics = await this.loadStatistics();
      statistics.expiringSoonItems = count;
      await this.saveStatistics(statistics);
      return true;
    } catch (error) {
      console.error('유통기한 임박 아이템 통계 업데이트 실패:', error);
      return false;
    }
  }

  // 만료된 아이템 수 업데이트
  async updateExpiredItems(count) {
    try {
      const statistics = await this.loadStatistics();
      statistics.expiredItems = count;
      await this.saveStatistics(statistics);
      return true;
    } catch (error) {
      console.error('만료된 아이템 통계 업데이트 실패:', error);
      return false;
    }
  }

  // 알림 전송 시 통계 업데이트
  async addNotificationSent() {
    try {
      const statistics = await this.loadStatistics();
      statistics.notificationsSent += 1;
      statistics.weeklyStats.notificationsSent += 1;
      statistics.monthlyStats.notificationsSent += 1;
      await this.saveStatistics(statistics);
      return true;
    } catch (error) {
      console.error('알림 전송 통계 업데이트 실패:', error);
      return false;
    }
  }

  // 알림 수신 시 통계 업데이트
  async addNotificationReceived() {
    try {
      const statistics = await this.loadStatistics();
      statistics.notificationsReceived += 1;
      await this.saveStatistics(statistics);
      return true;
    } catch (error) {
      console.error('알림 수신 통계 업데이트 실패:', error);
      return false;
    }
  }

  // 주간 통계 리셋 (매주 월요일에 호출)
  async resetWeeklyStats() {
    try {
      const statistics = await this.loadStatistics();
      statistics.weeklyStats = {
        foodAdded: 0,
        foodConsumed: 0,
        notificationsSent: 0,
      };
      await this.saveStatistics(statistics);
      return true;
    } catch (error) {
      console.error('주간 통계 리셋 실패:', error);
      return false;
    }
  }

  // 월간 통계 리셋 (매월 1일에 호출)
  async resetMonthlyStats() {
    try {
      const statistics = await this.loadStatistics();
      statistics.monthlyStats = {
        foodAdded: 0,
        foodConsumed: 0,
        notificationsSent: 0,
        mostAddedCategory: '',
      };
      await this.saveStatistics(statistics);
      return true;
    } catch (error) {
      console.error('월간 통계 리셋 실패:', error);
      return false;
    }
  }

  // 통계 데이터 초기화
  async resetStatistics() {
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      
      if (!user) {
        return false;
      }

      const key = this.getStatisticsKey(user.uid);
      await AsyncStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error('통계 데이터 초기화 실패:', error);
      return false;
    }
  }

  // 통계 요약 데이터 가져오기
  async getSummary() {
    try {
      const statistics = await this.loadStatistics();
      return {
        totalFoodItems: statistics.totalFoodItems,
        expiringSoonItems: statistics.expiringSoonItems,
        expiredItems: statistics.expiredItems,
        notificationsSent: statistics.notificationsSent,
        notificationsReceived: statistics.notificationsReceived,
        weeklyFoodAdded: statistics.weeklyStats.foodAdded,
        monthlyFoodAdded: statistics.monthlyStats.foodAdded,
        mostAddedCategory: statistics.monthlyStats.mostAddedCategory,
      };
    } catch (error) {
      console.error('통계 요약 데이터 가져오기 실패:', error);
      return {
        totalFoodItems: 0,
        expiringSoonItems: 0,
        expiredItems: 0,
        notificationsSent: 0,
        notificationsReceived: 0,
        weeklyFoodAdded: 0,
        monthlyFoodAdded: 0,
        mostAddedCategory: '',
      };
    }
  }
}

export default new StatisticsService();
