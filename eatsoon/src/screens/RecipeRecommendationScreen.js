import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, FlatList, ActivityIndicator, Button, Image } from 'react-native';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../config/firebase';
import { subscribePantry, fetchRecipesOnce, seedRecipesIfEmpty, dedupeRecipesByName } from '../services/firestore';
import { recommendRecipes } from '../utils/recommendation';

export default function RecipeRecommendationScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [pantry, setPantry] = useState([]);
  const [recipes, setRecipes] = useState([]);

  const [onlyFullMatch, setOnlyFullMatch] = useState(false);
  const [maxMissing, setMaxMissing] = useState(99);

  useEffect(() => {
    let unsubAuth;
    let unsubPantry;

    unsubAuth = onAuthStateChanged(auth, async (user) => {
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

  if (loading) return <ActivityIndicator />;

  return (
    <View style={{ flex: 1 }}>
      <View style={{ padding: 12, flexDirection: 'row', gap: 8, justifyContent: 'space-between' }}>
        <Button
          title={onlyFullMatch ? '완전매칭 ON' : '완전매칭 OFF'}
          onPress={() => setOnlyFullMatch(v => !v)}
        />
        <Button
          title={maxMissing <= 1 ? '부족≤1 ON' : '부족≤1 OFF'}
          onPress={() => setMaxMissing(v => (v <= 1 ? 99 : 1))}
        />
        <Button title="초기화" onPress={() => { setOnlyFullMatch(false); setMaxMissing(99); }} />
      </View>

      <FlatList
        data={ranked}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={{ paddingHorizontal: 12, paddingTop: 12, paddingBottom: 16 }}>
            <View style={{ backgroundColor:'#fff', borderRadius:12, overflow:'hidden', shadowColor:'#000', shadowOpacity:0.06, shadowRadius:8 }}>
              {item.imageUrl ? (
                <Image source={{ uri: item.imageUrl }} style={{ width: '100%', height: 180 }} resizeMode="cover" />
              ) : null}
              <View style={{ padding: 12, gap: 8 }}>
                <Text style={{ fontSize: 18, fontWeight: '700' }}>{item.title || item.name}</Text>
                <Text style={{ color:'#555' }}>매칭 {item.matchCount}/{item.neededCount} · 부족 {item.missing.length}개</Text>
                <View style={{ flexDirection:'row', gap: 12 }}>
                  {!!item.missing.length && (
                    <Button
                      title="부족 재료 장보기에 담기"
                      onPress={async () => {
                        const { addItemsMerged } = await import('../utils/shoppingList');
                        await addItemsMerged(item.missing, { recipeId: item.id });
                        navigation.navigate('ShoppingList');
                      }}
                    />
                  )}
                  <Button
                    title="자세히"
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
                  />
                </View>
              </View>
            </View>
          </View>
        )}
        ListEmptyComponent={
          <View style={{ padding: 16, gap: 8 }}>
            <Text>조건에 맞는 레시피가 없습니다. 필터를 조정해보세요.</Text>
            <View style={{ flexDirection:'row', gap: 8 }}>
              <Button title="샘플 레시피 추가" onPress={async () => { await seedRecipesIfEmpty(); await dedupeRecipesByName(); const r = await fetchRecipesOnce(); setRecipes(r); }} />
              <Button title="중복정리" onPress={async () => { await dedupeRecipesByName(); const r = await fetchRecipesOnce(); setRecipes(r); }} />
            </View>
          </View>
        }
      />
    </View>
  );
}
