import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { auth } from '../config/firebase';
import { subscribePantry, fetchRecipesOnce, seedRecipesIfEmpty, dedupeRecipesByName } from '../services/firestore';
import { recommendRecipes } from '../utils/recommendation';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Theme } from '../utils/colors';
import { 
  Container, 
  Card, 
  Button, 
  ButtonText,
  SectionHeader
} from '../components/StyledComponents';

// 매칭 상태를 시각적으로 보여주는 컴포넌트
const MatchingProgress = ({ matchCount, neededCount, missing }) => {
  const progress = neededCount > 0 ? matchCount / neededCount : 0;
  const progressPercentage = Math.round(progress * 100);
  
  return (
    <View style={styles.matchingContainer}>
      {/* 프로그레스 바 */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { width: `${progressPercentage}%` }
            ]} 
          />
        </View>
        <Text style={styles.progressText}>
          {matchCount}/{neededCount} ({progressPercentage}%)
        </Text>
      </View>
      
      {/* 재료 상태 표시 */}
      <View style={styles.ingredientsContainer}>
        <Text style={styles.ingredientsLabel}>재료 상태:</Text>
        <View style={styles.ingredientsGrid}>
          {/* 보유한 재료들 */}
          {Array.from({ length: matchCount }, (_, index) => (
            <View key={`have-${index}`} style={styles.ingredientHave}>
              <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
            </View>
          ))}
          {/* 부족한 재료들 */}
          {Array.from({ length: missing?.length || 0 }, (_, index) => (
            <View key={`missing-${index}`} style={styles.ingredientMissing}>
              <Ionicons name="close-circle" size={16} color={Colors.danger} />
            </View>
          ))}
        </View>
      </View>
      
      {/* 부족한 재료 목록 */}
      {(missing?.length || 0) > 0 && (
        <View style={styles.missingContainer}>
          <Text style={styles.missingLabel}>부족한 재료:</Text>
          <Text style={styles.missingText}>
            {missing.map(item => item.name).join(', ')}
          </Text>
        </View>
      )}
    </View>
  );
};

export default function RecipeRecommendationScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [pantry, setPantry] = useState([]);
  const [recipes, setRecipes] = useState([]);

  const [onlyFullMatch, setOnlyFullMatch] = useState(false);
  const [maxMissing, setMaxMissing] = useState(99);

  useEffect(() => {
    let unsubAuth;
    let unsubPantry;

    unsubAuth = auth.onAuthStateChanged(async (user) => {
      if (!user) {
        setPantry([]); setRecipes([]); setLoading(false);
        return;
      }
      unsubPantry = subscribePantry(setPantry);
      await seedRecipesIfEmpty();
      await dedupeRecipesByName();
      const r = await fetchRecipesOnce();
      setRecipes(r);
      setLoading(false);
    });

    return () => { if (unsubAuth) unsubAuth(); if (unsubPantry) unsubPantry(); };
  }, []);

  const ranked = useMemo(() => {
    if (loading) return [];
    return recommendRecipes(recipes, pantry, {
      topK: 50,
      maxMissing,
      onlyFullMatch,
    });
  }, [loading, recipes, pantry, maxMissing, onlyFullMatch]);

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
      {/* 필터 버튼들 */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={[styles.filterButton, onlyFullMatch && styles.filterButtonActive]}
          onPress={() => setOnlyFullMatch(!onlyFullMatch)}
        >
          <Ionicons 
            name={onlyFullMatch ? "checkmark-circle" : "ellipse-outline"} 
            size={16} 
            color={onlyFullMatch ? Colors.white : Colors.textSecondary} 
          />
          <Text style={[styles.filterButtonText, onlyFullMatch && styles.filterButtonTextActive]}>
            완전매칭
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.filterButton, maxMissing <= 1 && styles.filterButtonActive]}
          onPress={() => setMaxMissing(maxMissing <= 1 ? 99 : 1)}
        >
          <Ionicons 
            name={maxMissing <= 1 ? "checkmark-circle" : "ellipse-outline"} 
            size={16} 
            color={maxMissing <= 1 ? Colors.white : Colors.textSecondary} 
          />
          <Text style={[styles.filterButtonText, maxMissing <= 1 && styles.filterButtonTextActive]}>
            부족≤1
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => { setOnlyFullMatch(false); setMaxMissing(99); }}
        >
          <Ionicons name="refresh" size={16} color={Colors.textSecondary} />
          <Text style={styles.filterButtonText}>초기화</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={ranked}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Card style={styles.recipeCard}>
            {item.imageUrl ? (
              <Image source={{ uri: item.imageUrl }} style={styles.recipeImage} resizeMode="cover" />
            ) : (
              <View style={styles.recipeImagePlaceholder}>
                <Ionicons name="restaurant" size={48} color={Colors.textSecondary} />
              </View>
            )}
            
            <View style={styles.recipeContent}>
              <Text style={styles.recipeTitle}>{item.title || item.name}</Text>
              
              {/* 매칭 상태 시각화 */}
              <MatchingProgress 
                matchCount={item.matchCount}
                neededCount={item.neededCount}
                missing={item.missing}
              />
              
              <View style={styles.recipeActions}>
                {(item.missing?.length || 0) > 0 && (
                  <Button
                    style={[styles.actionButton, styles.shoppingButton]}
                    onPress={async () => {
                      const { addItemsMerged } = await import('../utils/shoppingList');
                      await addItemsMerged(item.missing, { recipeId: item.id });
                      navigation.navigate('ShoppingList');
                    }}
                  >
                    <Ionicons name="cart" size={16} color={Colors.white} />
                    <ButtonText style={styles.actionButtonText}>장보기에 담기</ButtonText>
                  </Button>
                )}
                
                <Button
                  style={[styles.actionButton, styles.detailButton]}
                  onPress={() => {
                    const safe = {
                      id: item.id,
                      name: item.name,
                      imageUrl: item.imageUrl,
                      ingredients: item.ingredients,
                      steps: item.steps,
                    };
                    navigation.navigate('RecipeDetail', { recipe: safe });
                  }}
                >
                  <Ionicons name="eye" size={16} color={Colors.white} />
                  <ButtonText style={styles.actionButtonText}>자세히 보기</ButtonText>
                </Button>
              </View>
            </View>
          </Card>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="restaurant-outline" size={64} color={Colors.textSecondary} />
            <Text style={styles.emptyTitle}>조건에 맞는 레시피가 없습니다</Text>
            <Text style={styles.emptySubtitle}>필터를 조정하거나 샘플 레시피를 추가해보세요</Text>
            
            <View style={styles.emptyActions}>
              <Button
                style={styles.emptyButton}
                onPress={async () => { 
                  await seedRecipesIfEmpty(); 
                  await dedupeRecipesByName(); 
                  const r = await fetchRecipesOnce(); 
                  setRecipes(r); 
                }}
              >
                <Ionicons name="add" size={16} color={Colors.white} />
                <ButtonText style={styles.emptyButtonText}>샘플 레시피 추가</ButtonText>
              </Button>
              
              <Button
                style={styles.emptyButton}
                onPress={async () => { 
                  await dedupeRecipesByName(); 
                  const r = await fetchRecipesOnce(); 
                  setRecipes(r); 
                }}
              >
                <Ionicons name="refresh" size={16} color={Colors.white} />
                <ButtonText style={styles.emptyButtonText}>중복정리</ButtonText>
              </Button>
            </View>
          </View>
        }
      />
    </Container>
  );
}

const styles = StyleSheet.create({
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
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm,
    gap: Theme.spacing.sm,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: Theme.spacing.sm,
    borderRadius: Theme.borderRadius.round,
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Theme.spacing.xs,
  },
  filterButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterButtonText: {
    fontSize: Theme.typography.small.fontSize,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: Colors.white,
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
  matchingContainer: {
    gap: Theme.spacing.sm,
  },
  progressContainer: {
    gap: Theme.spacing.xs,
  },
  progressBar: {
    height: 8,
    backgroundColor: Colors.border,
    borderRadius: Theme.borderRadius.sm,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.success,
    borderRadius: Theme.borderRadius.sm,
  },
  progressText: {
    fontSize: Theme.typography.small.fontSize,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  ingredientsContainer: {
    gap: Theme.spacing.xs,
  },
  ingredientsLabel: {
    fontSize: Theme.typography.small.fontSize,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  ingredientsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Theme.spacing.xs,
  },
  ingredientHave: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.success + '20',
    borderRadius: Theme.borderRadius.sm,
  },
  ingredientMissing: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.danger + '20',
    borderRadius: Theme.borderRadius.sm,
  },
  missingContainer: {
    padding: Theme.spacing.sm,
    backgroundColor: Colors.warning + '10',
    borderRadius: Theme.borderRadius.sm,
    borderLeftWidth: 3,
    borderLeftColor: Colors.warning,
  },
  missingLabel: {
    fontSize: Theme.typography.small.fontSize,
    color: Colors.warning,
    fontWeight: '600',
    marginBottom: Theme.spacing.xs,
  },
  missingText: {
    fontSize: Theme.typography.small.fontSize,
    color: Colors.textSecondary,
    lineHeight: 18,
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
