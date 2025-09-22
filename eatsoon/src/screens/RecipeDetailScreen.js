import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { auth, db } from '../config/firebase';
import { doc as fsDoc, getDoc } from 'firebase/firestore';
import { subscribePantry } from '../services/firestore';
import { indexPantry, findMatchingPantryItem } from '../utils/recommendation';

export default function RecipeDetailScreen({ route, navigation }) {
  const { recipe } = route.params;
  const [pantry, setPantry] = useState([]);
  const [ingredientStatus, setIngredientStatus] = useState([]);
  const [fullRecipe, setFullRecipe] = useState(recipe || {});
  const seasoningKeywords = ['양념', '양념장', '간장', '고추장', '고춧가루', '설탕', '소금', '참기름', '깨', '다진마늘', '다진 생강', '후추', '맛술', '미림', '물엿', '올리고당'];
  
  // 인분 표시 계산 (recipe.servings가 없을 때 보조 파싱)
  const getDisplayServings = () => {
    const raw = fullRecipe?.servings ?? fullRecipe?.serving ?? fullRecipe?.people ?? fullRecipe?.portions ?? fullRecipe?.cookingServings;
    console.log('🔎 detail recipe servings raw:', raw, typeof raw, 'all:', {
      servings: fullRecipe?.servings,
      serving: fullRecipe?.serving,
      people: fullRecipe?.people,
      portions: fullRecipe?.portions,
      cookingServings: fullRecipe?.cookingServings,
    });
    if (raw !== undefined && raw !== null && String(raw).trim() !== '') {
      const s = String(raw);
      const m = s.match(/(\d+)(?:\s*[~\-]\s*(\d+))?/);
      return m ? (m[0].replace(/\s+/g, '')) : s;
    }
    const name = String(fullRecipe?.name || '');
    // 2인분, 2~3인분, 2-3인분, 2 인
    let m = name.match(/(\d+)(?:\s*[~\-]\s*(\d+))?\s*인(?:분)?/);
    if (m) return m[1];
    // 재료 목록에서 \d+인분 패턴 탐색
    const ingArr = Array.isArray(fullRecipe?.ingredients) ? fullRecipe.ingredients : [];
    for (const ing of ingArr) {
      const text = typeof ing === 'string' ? ing : String(ing?.name || '');
      const mm = text.match(/(\d+)(?:\s*[~\-]\s*(\d+))?\s*인(?:분)?/);
      if (mm) return mm[1];
    }
    // 기본값 없음 (표시 숨김)
    return '';
  };
  const displayServings = getDisplayServings();
  const mentionsSeasoningInSteps = Array.isArray(fullRecipe?.steps)
    ? fullRecipe.steps.some((s) => typeof s === 'string' && seasoningKeywords.some(k => s.includes(k)))
    : false;
  const hasSeasoningInIngredients = Array.isArray(fullRecipe?.ingredients)
    ? fullRecipe.ingredients.some((ing) => {
        const text = typeof ing === 'string' ? ing : String(ing?.name || '');
        return seasoningKeywords.some(k => text.includes(k));
      })
    : false;

  // 재료 상태 확인
  useEffect(() => {
    let unsubPantry;
    
    unsubPantry = subscribePantry(setPantry);
    
    return () => {
      if (unsubPantry) unsubPantry();
    };
  }, []);

  // Firestore에서 문서 보강 로드
  useEffect(() => {
    const run = async () => {
      try {
        if (!recipe?.id) return;
        const snap = await getDoc(fsDoc(db, 'recipes', recipe.id));
        if (snap.exists()) {
          setFullRecipe(prev => ({ ...prev, ...snap.data(), id: recipe.id }));
        }
      } catch (e) {
        console.log('⚠️ failed to fetch recipe doc', e?.message || e);
      }
    };
    run();
  }, [recipe?.id]);

  useEffect(() => {
    if (pantry.length > 0 && fullRecipe.ingredients) {
      const pantryIdx = indexPantry(pantry);

      // 조리도구(도마/스푼/칼 등) 필터링 목록
      const utensilKeywords = [
        '도마','칼','조리용나이프','나이프','스푼','수저','숟가락','젓가락','집게','뒤집개','국자','거품기','볼','그릇','냄비','팬','프라이팬','오븐','전자레인지','믹서기','블렌더','체','망','찜기','압력솥','계량컵','계량스푼'
      ];

      const filtered = fullRecipe.ingredients.filter(ing => {
        const text = (typeof ing === 'string' ? ing : (ing?.name || '')).toLowerCase();
        return !utensilKeywords.some(k => text.includes(k.toLowerCase()));
      });

      const status = filtered.map(ingredient => {
        const ingredientName = typeof ingredient === 'string' ? ingredient : ingredient.name || '';
        
        // 물은 항상 보유한 것으로 간주
        const normalized = ingredientName.trim().toLowerCase();
        if (normalized === '물' || normalized.startsWith('물') || normalized.includes('물') || normalized.includes('water')) {
          return {
            name: ingredientName,
            quantity: typeof ingredient === 'string' ? '' : ingredient.quantity || '',
            unit: typeof ingredient === 'string' ? '' : ingredient.unit || '',
            isAvailable: true,
            matchingItems: []
          };
        }
        
        const matchingItems = findMatchingPantryItem(ingredientName, pantryIdx);
        const isAvailable = matchingItems.length > 0;
        
        return {
          name: ingredientName,
          quantity: typeof ingredient === 'string' ? '' : ingredient.quantity || '',
          unit: typeof ingredient === 'string' ? '' : ingredient.unit || '',
          isAvailable,
          matchingItems
        };
      });
      
      setIngredientStatus(status);
    }
  }, [pantry, fullRecipe.ingredients]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backButtonText}>← 뒤로</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{fullRecipe.name}</Text>
      </View>
      
      <ScrollView style={styles.scrollView}>

      {fullRecipe.imageUrl && (
        <Image source={{ uri: fullRecipe.imageUrl }} style={styles.image} />
      )}

      <View style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            필요한 재료{displayServings ? ` (${displayServings}인분 기준)` : ''}
          </Text>
          <View style={styles.ingredientsList}>
            {mentionsSeasoningInSteps && !hasSeasoningInIngredients && (
              <View style={styles.noticeBox}>
                <Ionicons name="alert-circle" size={18} color="#8a6d3b" />
                <Text style={styles.noticeText}>양념 재료가 본문에만 언급된 레시피입니다. 하단의 출처 링크를 참고해 주세요.</Text>
              </View>
            )}
            {ingredientStatus.length > 0 ? (
              ingredientStatus.map((ingredient, index) => (
                <View key={index} style={styles.ingredientItem}>
                  <View style={styles.ingredientRow}>
                    <Ionicons 
                      name={ingredient.isAvailable ? "checkmark-circle" : "close-circle"} 
                      size={20} 
                      color={ingredient.isAvailable ? "#4ECDC4" : "#FF6B6B"} 
                    />
                    <Text style={[
                      styles.ingredientText,
                      { color: ingredient.isAvailable ? "#333" : "#999" }
                    ]}>
                      {ingredient.name} {ingredient.quantity}{ingredient.unit}
                    </Text>
                  </View>
                  {!ingredient.isAvailable && (
                    <Text style={styles.missingText}>부족한 재료</Text>
                  )}
                </View>
              ))
            ) : (
              (fullRecipe.ingredients || []).map((ingredient, index) => (
                <View key={index} style={styles.ingredientItem}>
                  <Text style={styles.ingredientText}>
                    • {typeof ingredient === 'string' 
                      ? ingredient 
                      : `${ingredient.name} ${ingredient.quantity}${ingredient.unit}`}
                  </Text>
                </View>
              ))
            )}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>요리 과정</Text>
          <View style={styles.stepsList}>
            {(fullRecipe.steps || []).map((step, index) => (
              <View key={index} style={styles.stepItem}>
                <View style={styles.stepNumber}>
                  <Text style={styles.stepNumberText}>{index + 1}</Text>
                </View>
                <Text style={styles.stepText} allowFontScaling={false} lineBreakStrategyIOS="hangul-word">{step}</Text>
              </View>
            ))}
          </View>
        </View>

        {fullRecipe?.sourceUrl ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>출처</Text>
            <TouchableOpacity onPress={() => Linking.openURL(fullRecipe.sourceUrl)}>
              <Text style={styles.sourceLink}>{fullRecipe.sourceUrl}</Text>
            </TouchableOpacity>
          </View>
        ) : null}
      </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  backButton: {
    marginRight: 12,
  },
  backButtonText: {
    fontSize: 16,
    color: '#007bff',
    fontWeight: '500',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212529',
    flex: 1,
  },
  image: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  content: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 12,
  },
  ingredientsList: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  ingredientItem: {
    marginBottom: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  ingredientRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  ingredientText: {
    fontSize: 16,
    lineHeight: 24,
    marginLeft: 8,
    flex: 1,
  },
  missingText: {
    fontSize: 12,
    color: '#FF6B6B',
    marginTop: 4,
    fontStyle: 'italic',
  },
  stepsList: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#007bff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  stepNumberText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  stepText: {
    flex: 1,
    fontSize: 16,
    color: '#495057',
    lineHeight: 24,
    flexShrink: 1,
    flexWrap: 'wrap',
    includeFontPadding: false,
    textAlignVertical: 'top',
  },
  noticeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    backgroundColor: '#fcf8e3',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#faebcc',
    marginBottom: 8,
  },
  noticeText: {
    flex: 1,
    color: '#8a6d3b',
    fontSize: 13,
  },
  sourceLink: {
    color: '#0066cc',
    textDecorationLine: 'underline',
    fontSize: 14,
  },
});
