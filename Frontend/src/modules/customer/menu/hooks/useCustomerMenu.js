import { useState, useEffect, useMemo } from 'react';
import { customerMenuService } from '../services/customerMenuService';
import { useCart } from '../../cart/hooks/useCart';

export const useCustomerMenu = (initialCanteenId = null) => {
  const { selectedOutlet, setSelectedOutlet } = useCart();
  const [canteens, setCanteens] = useState([]);
  const [foodItems, setFoodItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedFoodType, setSelectedFoodType] = useState('ALL'); // ALL, Veg, Non-veg
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        setLoading(true);
        const [activeCanteens, items, activeCats] = await Promise.all([
          customerMenuService.getActiveCanteens().catch(() => []),
          customerMenuService.getAllFoodItems().catch(() => []),
          customerMenuService.getActiveCategories().catch(() => [])
        ]);

        if (!isMounted) return;

        const safeCanteens = Array.isArray(activeCanteens) ? activeCanteens : [];
        const safeItems = Array.isArray(items) ? items : [];

        setCanteens(safeCanteens);
        setFoodItems(safeItems);

        if (Array.isArray(activeCats) && activeCats.length > 0) {
          setCategories(activeCats);
        }

        // Handle outlet selection: default to 'ALL' (all campus dining halls) unless explicit initialCanteenId is provided
        if (initialCanteenId && safeCanteens.some(c => c && String(c.id) === String(initialCanteenId))) {
          const match = safeCanteens.find(c => c && String(c.id) === String(initialCanteenId));
          setSelectedOutlet(match);
        } else if (!selectedOutlet || selectedOutlet.id === 'canteen-001') {
          setSelectedOutlet({ id: 'ALL', name: 'All Campus Dining Halls' });
        }
      } catch (err) {
        console.error('Failed to load menu data:', err);
        if (isMounted) {
          setCanteens([]);
          setFoodItems([]);
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, [initialCanteenId, selectedOutlet, setSelectedOutlet]);

  const filteredItems = useMemo(() => {
    if (!Array.isArray(foodItems)) return [];

    return foodItems.filter(item => {
      if (!item) return false;

      // 1. Outlet Filter (Show items for selected canteen or all campus)
      const matchesOutlet =
        !selectedOutlet ||
        selectedOutlet.id === 'ALL' ||
        String(item.outletId) === String(selectedOutlet.id) ||
        String(item.canteenId) === String(selectedOutlet.id);

      // 2. Category Filter (Safe for both string category and { id, name } object)
      const itemCat = typeof item.category === 'object'
        ? (item.category?.name || item.category?.id || '')
        : (item.category || '');
      const itemCatId = item.categoryId || (typeof item.category === 'object' ? item.category?.id : '');
      const matchesCategory =
        selectedCategory === 'ALL' ||
        String(itemCat).toLowerCase() === String(selectedCategory).toLowerCase() ||
        String(itemCatId) === String(selectedCategory);

      // 3. Dietary Filter
      const itemDiet = (item.foodType || item.dietary || '').toLowerCase();
      const targetDiet = (selectedFoodType || 'ALL').toLowerCase();
      const isVeg = item.isVeg === true || (itemDiet.includes('veg') && !itemDiet.includes('non'));
      const isNonVeg = item.isVeg === false || itemDiet.includes('non') || itemDiet.includes('egg') || itemDiet.includes('meat') || itemDiet.includes('chicken');

      const matchesFoodType =
        targetDiet === 'all' ||
        ((targetDiet.includes('veg') && !targetDiet.includes('non')) ? isVeg : false) ||
        (targetDiet.includes('non') ? isNonVeg : false);

      // 4. Search Filter
      const query = (searchQuery || '').trim().toLowerCase();
      const matchesSearch =
        !query ||
        (item.name && item.name.toLowerCase().includes(query)) ||
        (item.code && item.code.toLowerCase().includes(query)) ||
        (item.description && item.description.toLowerCase().includes(query)) ||
        (itemCat && String(itemCat).toLowerCase().includes(query));

      return matchesOutlet && matchesCategory && matchesFoodType && matchesSearch;
    });
  }, [foodItems, selectedOutlet, selectedCategory, selectedFoodType, searchQuery]);

  const safeCategories = Array.isArray(categories) ? categories : [];
  const safeFilteredItems = Array.isArray(filteredItems) ? filteredItems : [];
  const safeAllItems = Array.isArray(foodItems) ? foodItems : [];
  const safeCanteens = Array.isArray(canteens) ? canteens : [];

  return {
    canteens: safeCanteens,
    selectedOutlet,
    setSelectedOutlet,
    filteredItems: safeFilteredItems,
    foodItems: safeFilteredItems, // Alias so components destructuring either property get valid arrays
    allFoodItems: safeAllItems,
    categories: safeCategories,
    selectedCategory,
    setSelectedCategory,
    selectedFoodType,
    setSelectedFoodType,
    searchQuery,
    setSearchQuery,
    loading
  };
};

export default useCustomerMenu;
