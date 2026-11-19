import { useState, useEffect, useMemo } from 'react';
import { customerMenuService } from '../services/customerMenuService';
import { useCart } from '../../cart/hooks/useCart';

export const useCustomerMenu = (initialCanteenId = null) => {
  const { selectedOutlet, setSelectedOutlet } = useCart();
  const [canteens, setCanteens] = useState([]);
  const [foodItems, setFoodItems] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedFoodType, setSelectedFoodType] = useState('ALL'); // ALL, Veg, Non-veg
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        setLoading(true);
        const [activeCanteens, items] = await Promise.all([
          customerMenuService.getActiveCanteens().catch(() => []),
          customerMenuService.getAllFoodItems().catch(() => [])
        ]);

        if (!isMounted) return;

        const safeCanteens = Array.isArray(activeCanteens) ? activeCanteens : [];
        const safeItems = Array.isArray(items) ? items : [];

        setCanteens(safeCanteens);
        setFoodItems(safeItems);

        if (initialCanteenId && safeCanteens.some(c => c && c.id === initialCanteenId)) {
          const match = safeCanteens.find(c => c && c.id === initialCanteenId);
          setSelectedOutlet(match);
        } else {
          if (!selectedOutlet && safeCanteens.length > 0) {
            setSelectedOutlet(safeCanteens[0]);
          }
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
        item.outletId === selectedOutlet.id;

      // 2. Category Filter (Safe for both string category and { id, name } object)
      const itemCat = typeof item.category === 'object'
        ? (item.category?.id || item.category?.name || '')
        : (item.category || '');
      const matchesCategory =
        selectedCategory === 'ALL' ||
        itemCat === selectedCategory ||
        itemCat.toLowerCase() === String(selectedCategory).toLowerCase();

      // 3. Dietary Filter
      const itemDiet = (item.foodType || '').toLowerCase();
      const targetDiet = (selectedFoodType || '').toLowerCase();
      const matchesFoodType =
        selectedFoodType === 'ALL' ||
        itemDiet === targetDiet;

      // 4. Search Filter
      const query = (searchQuery || '').trim().toLowerCase();
      const matchesSearch =
        !query ||
        (item.name && item.name.toLowerCase().includes(query)) ||
        (item.description && item.description.toLowerCase().includes(query)) ||
        (itemCat && itemCat.toLowerCase().includes(query));

      return matchesOutlet && matchesCategory && matchesFoodType && matchesSearch;
    });
  }, [foodItems, selectedOutlet, selectedCategory, selectedFoodType, searchQuery]);

  const rawCategories = customerMenuService.getCategories();
  const safeCategories = Array.isArray(rawCategories) ? rawCategories : [];
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
