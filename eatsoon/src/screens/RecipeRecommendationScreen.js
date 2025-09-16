import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity, Image, StyleSheet, ScrollView, Alert, TextInput } from 'react-native';
import { auth } from '../config/firebase';
import { subscribePantry, fetchRecipesOnce, seedRecipesIfEmpty, dedupeRecipesByName } from '../services/firestore';
import { recommendRecipes, searchRecipes, recommendByExpiringIngredients, recommendByAvailableIngredients, indexPantry, scoreRecipe } from '../utils/recommendation';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Theme } from '../utils/colors';
import { 
  Container, 
  Card, 
  Button, 
  ButtonText,
  SectionHeader
} from '../components/StyledComponents';


export default function RecipeRecommendationScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [pantry, setPantry] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'expiring', 'available'
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    let unsubAuth;
    let unsubPantry;

    unsubAuth = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        setPantry([]); setRecipes([]); setLoading(false);
        return;
      }
      unsubPantry = subscribePantry(setPantry);
      // replaceWithCrawledRecipes() 제거 - Firebase에 이미 크롤링된 레시피만 있음
      const r = await fetchRecipesOnce();
      console.log('📥 fetched recipe sample keys:', r[0] ? Object.keys(r[0]) : 'none');
      setRecipes(r);
      setLoading(false);
    });

    return () => { if (unsubAuth) unsubAuth(); if (unsubPantry) unsubPantry(); };
  }, []);

  const ranked = useMemo(() => {
    if (loading) return [];
    
    console.log('🔍 레시피 추천 로직 시작:', { 
      recipesCount: recipes.length, 
      activeTab, 
      searchQuery,
      pantryCount: pantry.length 
    });
    
    let filteredRecipes = recipes;
    
    // 검색 기능
    if (searchQuery.trim()) {
      filteredRecipes = searchRecipes(recipes, searchQuery);
      console.log('🔍 검색 결과:', filteredRecipes.length);
    }
    
    // 탭별 추천 로직
    let result;
    switch (activeTab) {
      case 'expiring':
        result = recommendByExpiringIngredients(filteredRecipes, pantry);
        console.log('⏰ 유통기한 임박 추천:', result.length);
        break;
      case 'available':
        result = recommendByAvailableIngredients(filteredRecipes, pantry);
        console.log('✅ 현재 재료로 추천:', result.length);
        break;
      case 'all':
      default:
        const pantryIdx = indexPantry(pantry);
        result = filteredRecipes.map(recipe => {
          return { ...recipe, ...scoreRecipe(recipe, pantryIdx) };
        }).sort((a, b) => b.score - a.score);
        console.log('📋 전체 레시피:', result.length);
        break;
    }
    
    console.log('🎯 최종 추천 결과:', result.slice(0, 5).map(r => r.name));
    return result;
  }, [loading, recipes, pantry, activeTab, searchQuery]);

  if (loading) return (
    <Container>
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>레시피를 불러오는 중...</Text>
      </View>
    </Container>
  );

  return (
    <Container>
      <ScrollView 
        style={styles.scrollContainer}
        showsVerticalScrollIndicator={true}
        scrollEnabled={true}
        contentContainerStyle={{ flexGrow: 1 }}
      >
        {/* 검색창 */}
        <View style={styles.searchContainer}>
          <Text style={styles.searchLabel}>🔍 레시피 검색</Text>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search" size={20} color={Colors.textSecondary} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="된장찌개, 김치 등 검색"
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholderTextColor={Colors.textSecondary}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearButton}>
                <Ionicons name="close-circle" size={20} color={Colors.textSecondary} />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* 탭 버튼들 */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'all' && styles.tabButtonActive]}
            onPress={() => setActiveTab('all')}
          >
            <Text style={[styles.tabButtonText, activeTab === 'all' && styles.tabButtonTextActive]}>
              전체
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'expiring' && styles.tabButtonActive]}
            onPress={() => setActiveTab('expiring')}
          >
            <Text style={[styles.tabButtonText, activeTab === 'expiring' && styles.tabButtonTextActive]}>
              유통기한 임박
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tabButton, activeTab === 'available' && styles.tabButtonActive]}
            onPress={() => setActiveTab('available')}
          >
            <Text style={[styles.tabButtonText, activeTab === 'available' && styles.tabButtonTextActive]}>
              현재 재료로
            </Text>
          </TouchableOpacity>
        </View>

        {/* 레시피 리스트 */}
        <View style={styles.recipeListContainer}>
          {ranked.map((item) => (
            <Card key={item.id} style={styles.recipeCard}>
              {/* 이미지는 명확한 경우에만 표시 */}
              {item.imageUrl && item.imageUrl.includes('unsplash.com') ? (
                <Image source={{ uri: item.imageUrl }} style={styles.recipeImage} resizeMode="cover" />
              ) : null}
              
              <View style={styles.recipeContent}>
                <Text style={styles.recipeTitle}>{item.title || item.name}</Text>
                
                {/* 매칭 상태 표시 */}
                <View style={styles.matchingInfo}>
                  <Text style={styles.matchingText}>
                    재료: {item.matchCount || 0}/{item.neededCount || 0} 보유
                    {item.missing && item.missing.length > 0 && (
                      <Text style={styles.missingText}>
                        {' '}(부족: {item.missing.length}개)
                      </Text>
                    )}
                  </Text>
                </View>
                
                <View style={styles.recipeActions}>
                  <Button
                    style={[styles.actionButton, styles.shoppingButton]}
                    onPress={async () => {
                      const { addItem } = await import('../utils/shoppingList');
                      if (item.missing && item.missing.length > 0) {
                        // 각 부족한 재료를 개별 항목으로 추가
                        for (const missingItem of item.missing) {
                          await addItem(missingItem.name, 1, missingItem.unit || '개');
                        }
                        Alert.alert('완료', `${item.missing.length}개 재료가 장보기 리스트에 추가되었습니다.`);
                      } else {
                        Alert.alert('알림', '부족한 재료가 없습니다.');
                      }
                      navigation.navigate('ShoppingList');
                    }}
                  >
                    <Ionicons name="cart" size={16} color={Colors.white} />
                    <ButtonText style={styles.actionButtonText}>장보기에 담기</ButtonText>
                  </Button>
                  
                  <Button
                    style={[styles.actionButton, styles.detailButton]}
                    onPress={() => {
                      console.log('🔎 navigate recipe servings:', item?.servings, typeof item?.servings);
                      navigation.navigate('RecipeDetail', { recipe: item });
                    }}
                  >
                    <Ionicons name="eye" size={16} color={Colors.white} />
                    <ButtonText style={styles.actionButtonText}>자세히 보기</ButtonText>
                  </Button>
                </View>
              </View>
            </Card>
          ))}
          
          {ranked.length === 0 && (
            <View style={styles.emptyContainer}>
              <Ionicons name="restaurant-outline" size={64} color={Colors.textSecondary} />
              <Text style={styles.emptyTitle}>조건에 맞는 레시피가 없습니다</Text>
              <Text style={styles.emptySubtitle}>필터를 조정해보세요</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </Container>
  );
}

const styles = StyleSheet.create({
  scrollContainer: {
    flex: 1,
  },
  recipeListContainer: {
    paddingBottom: 100,
  },
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
  searchContainer: {
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  searchLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginBottom: Theme.spacing.sm,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderRadius: Theme.borderRadius.round,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm,
  },
  searchIcon: {
    marginRight: Theme.spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: Theme.typography.body.fontSize,
    color: Colors.textPrimary,
  },
  clearButton: {
    marginLeft: Theme.spacing.sm,
  },
  tabContainer: {
    flexDirection: 'row',
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: Theme.spacing.sm,
    paddingHorizontal: Theme.spacing.md,
    borderRadius: Theme.borderRadius.round,
    backgroundColor: Colors.background,
    marginHorizontal: 2,
  },
  tabButtonActive: {
    backgroundColor: Colors.primary,
  },
  tabButtonText: {
    fontSize: Theme.typography.small.fontSize,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  tabButtonTextActive: {
    color: Colors.white,
  },
  matchingInfo: {
    marginVertical: Theme.spacing.sm,
  },
  matchingText: {
    fontSize: Theme.typography.small.fontSize,
    color: Colors.textSecondary,
  },
  missingText: {
    color: Colors.danger,
    fontWeight: '500',
  },
  recipeCard: {
    marginHorizontal: Theme.spacing.md,
    marginVertical: Theme.spacing.sm,
    overflow: 'hidden',
  },
  recipeImage: {
    width: '100%',
    height: 200,
  },
  recipeImagePlaceholder: {
    width: '100%',
    height: 200,
    backgroundColor: Colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recipeContent: {
    padding: Theme.spacing.md,
    gap: Theme.spacing.md,
  },
  recipeTitle: {
    fontSize: Theme.typography.h4.fontSize,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  recipeActions: {
    flexDirection: 'row',
    gap: Theme.spacing.sm,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Theme.spacing.sm,
    borderRadius: Theme.borderRadius.md,
    gap: Theme.spacing.xs,
  },
  shoppingButton: {
    backgroundColor: Colors.info,
  },
  detailButton: {
    backgroundColor: Colors.primary,
  },
  actionButtonText: {
    fontSize: Theme.typography.small.fontSize,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Theme.spacing.xl,
    paddingHorizontal: Theme.spacing.lg,
  },
  emptyTitle: {
    fontSize: Theme.typography.h4.fontSize,
    fontWeight: '600',
    color: Colors.textPrimary,
    marginTop: Theme.spacing.md,
    marginBottom: Theme.spacing.xs,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: Theme.typography.body.fontSize,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Theme.spacing.lg,
  },
  emptyActions: {
    flexDirection: 'row',
    gap: Theme.spacing.sm,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm,
    borderRadius: Theme.borderRadius.md,
    backgroundColor: Colors.primary,
    gap: Theme.spacing.xs,
  },
  emptyButtonText: {
    fontSize: Theme.typography.small.fontSize,
    fontWeight: '600',
  },
});
