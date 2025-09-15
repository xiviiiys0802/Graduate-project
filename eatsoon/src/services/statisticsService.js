import AsyncStorage from '@react-native-async-storage/async-storage';
import { getAuth } from 'firebase/auth';
import { loadFoodItemsFromFirestore } from '../utils/firebaseStorage';

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

  // 실제 Firestore 데이터를 기반으로 통계 계산
  async getRealtimeSummary() {
    try {
      const foodItems = await loadFoodItemsFromFirestore() || [];
      const now = new Date();
      
      // 유통기한 임박 아이템 계산 (3일 이내)
      const expiringSoonItems = (foodItems?.filter(item => {
        const expiryDate = new Date(item.expirationDate);
        const diffTime = expiryDate - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= 3 && diffDays >= 0;
      }) || []).length;
      
      // 만료된 아이템 계산
      const expiredItems = (foodItems?.filter(item => {
        const expiryDate = new Date(item.expirationDate);
        return expiryDate < now;
      }) || []).length;
      
      // 이번 주 알림 수 (로컬 통계에서 가져오기)
      const statistics = await this.loadStatistics();
      
      return {
        totalFoodItems: foodItems?.length || 0,
        expiringSoonItems: expiringSoonItems,
        expiredItems: expiredItems,
        notificationsSent: statistics.weeklyStats.notificationsSent || 0,
        notificationsReceived: statistics.notificationsReceived || 0,
        weeklyFoodAdded: statistics.weeklyStats.foodAdded || 0,
        monthlyFoodAdded: statistics.monthlyStats.foodAdded || 0,
        mostAddedCategory: statistics.monthlyStats.mostAddedCategory || '',
      };
    } catch (error) {
      console.error('실시간 통계 계산 실패:', error);
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

  // 실제 Firestore 데이터를 기반으로 완전한 통계 계산
  async getRealtimeFullStatistics() {
    try {
      const foodItems = await loadFoodItemsFromFirestore() || [];
      const now = new Date();
      
      // 기본 통계 계산
      const totalFoodItems = foodItems?.length || 0;
      
      // 유통기한 임박 아이템 계산 (3일 이내)
      const expiringSoonItems = (foodItems?.filter(item => {
        const expiryDate = new Date(item.expirationDate);
        const diffTime = expiryDate - now;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= 3 && diffDays >= 0;
      }) || []).length;
      
      // 만료된 아이템 계산
      const expiredItems = (foodItems?.filter(item => {
        const expiryDate = new Date(item.expirationDate);
        return expiryDate < now;
      }) || []).length;
      
      // 카테고리별 분포 계산
      const categories = {
        dairy: 0,
        meat: 0,
        vegetables: 0,
        fruits: 0,
        grains: 0,
        beverages: 0,
        snacks: 0,
        others: 0,
      };
      
      foodItems.forEach(item => {
        const categoryKey = this.getCategoryKey(item.category);
        if (categories[categoryKey] !== undefined) {
          categories[categoryKey] += 1;
        } else {
          categories.others += 1;
        }
      });
      
      // 가장 많이 추가된 카테고리 찾기
      const mostAddedCategory = Object.entries(categories).reduce((a, b) => 
        categories[a[0]] > categories[b[0]] ? a : b
      )[0];
      
      // 이번 주 추가된 음식 계산 (최근 7일)
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const weeklyFoodAdded = (foodItems?.filter(item => {
        const addedDate = new Date(item.addedDate);
        return addedDate >= weekAgo;
      }) || []).length;
      
      // 이번 달 추가된 음식 계산 (최근 30일)
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const monthlyFoodAdded = (foodItems?.filter(item => {
        const addedDate = new Date(item.addedDate);
        return addedDate >= monthAgo;
      }) || []).length;
      
      // 로컬 통계에서 알림 관련 데이터 가져오기
      const localStats = await this.loadStatistics();
      
      return {
        totalFoodItems,
        expiringSoonItems,
        expiredItems,
        notificationsSent: localStats.notificationsSent || 0,
        notificationsReceived: localStats.notificationsReceived || 0,
        weeklyStats: {
          foodAdded: weeklyFoodAdded,
          foodConsumed: 0, // 소비 데이터는 별도 추적 필요
          notificationsSent: localStats.weeklyStats.notificationsSent || 0,
        },
        monthlyStats: {
          foodAdded: monthlyFoodAdded,
          foodConsumed: 0, // 소비 데이터는 별도 추적 필요
          notificationsSent: localStats.monthlyStats.notificationsSent || 0,
          mostAddedCategory,
        },
        categories,
        lastUpdated: new Date().toISOString(),
      };
    } catch (error) {
      console.error('실시간 전체 통계 계산 실패:', error);
      return defaultStatistics;
    }
  }

  // 카테고리 키 변환 함수
  getCategoryKey(category) {
    const categoryMap = {
      '유제품': 'dairy',
      '육류': 'meat',
      '채소': 'vegetables',
      '과일': 'fruits',
      '곡물': 'grains',
      '음료': 'beverages',
      '간식': 'snacks',
    };
    return categoryMap[category] || 'others';
  }

  // 요일별 음식 추가 데이터 계산
  async getWeeklyFoodAddedData() {
    try {
      const foodItems = await loadFoodItemsFromFirestore() || [];
      const now = new Date();
      
      // 이번 주 월요일부터 일요일까지의 날짜 범위 계산
      const monday = new Date(now);
      monday.setDate(now.getDate() - now.getDay() + 1); // 월요일
      monday.setHours(0, 0, 0, 0);
      
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6); // 일요일
      sunday.setHours(23, 59, 59, 999);
      
      const days = ['월', '화', '수', '목', '금', '토', '일'];
      const weeklyData = [];
      
      for (let i = 0; i < 7; i++) {
        const dayStart = new Date(monday);
        dayStart.setDate(monday.getDate() + i);
        dayStart.setHours(0, 0, 0, 0);
        
        const dayEnd = new Date(dayStart);
        dayEnd.setHours(23, 59, 59, 999);
        
        // 해당 요일에 추가된 음식 수 계산
        const dayFoodCount = (foodItems?.filter(item => {
          const addedDate = new Date(item.addedDate);
          return addedDate >= dayStart && addedDate <= dayEnd;
        }) || []).length;
        
        weeklyData.push({
          label: days[i],
          value: dayFoodCount,
        });
      }
      
      return weeklyData;
    } catch (error) {
      console.error('요일별 데이터 계산 실패:', error);
      // 오류 시 빈 데이터 반환
      return ['월', '화', '수', '목', '금', '토', '일'].map(day => ({
        label: day,
        value: 0,
      }));
    }
  }

  // 통계 요약 데이터 가져오기 (기존 함수 유지)
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
