import React, { useState, useMemo } from 'react';
import { PlusCircle } from 'lucide-react';
import { PageHeader } from '../../../../components/common/PageHeader';
import { Button } from '../../../../components/common/Button';
import { Pagination } from '../../../../components/common/Pagination';
import { ConfirmationModal } from '../../../../components/common/ConfirmationModal';
import { useMenuItems } from '../hooks/useMenuItems';
import { MenuFilters } from '../components/MenuFilters';
import { MenuTable } from '../components/MenuTable';
import { MenuModal } from '../components/MenuModal';
import { MenuItemDetailsModal } from '../components/MenuItemDetailsModal';

export const MenuListPage = () => {
  const {
    menuItems,
    loading,
    createMenuItem,
    updateMenuItem,
    toggleStatus,
    togglePublish,
    deleteItem
  } = useMenuItems();

  // Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedFoodType, setSelectedFoodType] = useState('ALL');
  const [selectedOutlet, setSelectedOutlet] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);

  // Modals state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [viewingItem, setViewingItem] = useState(null);
  const [itemToToggle, setItemToToggle] = useState(null);
  const [itemToDelete, setItemToDelete] = useState(null);

  // Filtered menu items
  const filteredItems = useMemo(() => {
    return menuItems.filter(item => {
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const matchesName = item.name?.toLowerCase().includes(q);
        const matchesCode = item.code?.toLowerCase().includes(q);
        const matchesDesc = item.description?.toLowerCase().includes(q);
        if (!matchesName && !matchesCode && !matchesDesc) return false;
      }
      if (selectedCategory !== 'ALL' && item.category !== selectedCategory) return false;
      if (selectedFoodType !== 'ALL' && item.foodType !== selectedFoodType) return false;
      if (selectedOutlet !== 'ALL' && item.outletId !== selectedOutlet) return false;
      if (selectedStatus !== 'ALL' && item.status !== selectedStatus) return false;
      return true;
    });
  }, [menuItems, searchTerm, selectedCategory, selectedFoodType, selectedOutlet, selectedStatus]);

  // Paginated items
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredItems.slice(start, start + pageSize);
  }, [filteredItems, currentPage, pageSize]);

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedCategory('ALL');
    setSelectedFoodType('ALL');
    setSelectedOutlet('ALL');
    setSelectedStatus('ALL');
    setCurrentPage(1);
  };

  const handleOpenCreate = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (item) => {
    setEditingItem(item);
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (formData) => {
    if (editingItem) {
      await updateMenuItem(editingItem.id, formData);
    } else {
      await createMenuItem(formData);
    }
    setIsModalOpen(false);
  };

  const handleConfirmToggle = async () => {
    if (itemToToggle) {
      await toggleStatus(itemToToggle.id);
      setItemToToggle(null);
    }
  };

  const handleConfirmDelete = async () => {
    if (itemToDelete) {
      await deleteItem(itemToDelete.id);
      setItemToDelete(null);
    }
  };

  return (
    <div>
      <PageHeader
        title="Menu Item Management"
        description="Configure institutional meal offerings, dietary classifications, preparation schedules, daily capacities, and publication states."
        actions={
          <Button
            variant="primary"
            icon={PlusCircle}
            onClick={handleOpenCreate}
          >
            Add Menu Item
          </Button>
        }
      />

      {/* Filter Toolbar */}
      <MenuFilters
        searchTerm={searchTerm}
        onSearchChange={(v) => { setSearchTerm(v); setCurrentPage(1); }}
        selectedCategory={selectedCategory}
        onCategoryChange={(v) => { setSelectedCategory(v); setCurrentPage(1); }}
        selectedFoodType={selectedFoodType}
        onFoodTypeChange={(v) => { setSelectedFoodType(v); setCurrentPage(1); }}
        selectedOutlet={selectedOutlet}
        onOutletChange={(v) => { setSelectedOutlet(v); setCurrentPage(1); }}
        selectedStatus={selectedStatus}
        onStatusChange={(v) => { setSelectedStatus(v); setCurrentPage(1); }}
        onReset={handleResetFilters}
      />

      {/* Menu Table */}
      <MenuTable
        items={paginatedItems}
        loading={loading}
        onView={(item) => setViewingItem(item)}
        onEdit={handleOpenEdit}
        onToggleStatus={(item) => setItemToToggle(item)}
        onTogglePublish={(item) => togglePublish(item.id)}
        onDelete={(item) => setItemToDelete(item)}
        footer={
          <Pagination
            currentPage={currentPage}
            totalItems={filteredItems.length}
            pageSize={pageSize}
            onPageChange={setCurrentPage}
            onPageSizeChange={(sz) => { setPageSize(sz); setCurrentPage(1); }}
            pageSizeOptions={[5, 10, 20]}
          />
        }
      />

      {/* Create/Edit Modal */}
      <MenuModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleFormSubmit}
        initialData={editingItem}
        title={editingItem ? 'Edit Menu Item' : 'Create New Menu Item'}
      />

      {/* Item Details View Modal */}
      <MenuItemDetailsModal
        isOpen={Boolean(viewingItem)}
        onClose={() => setViewingItem(null)}
        item={viewingItem}
      />

      {/* Status Toggle Modal */}
      {itemToToggle && (
        <ConfirmationModal
          isOpen={Boolean(itemToToggle)}
          onClose={() => setItemToToggle(null)}
          onConfirm={handleConfirmToggle}
          title={itemToToggle.status === 'Active' ? 'Deactivate Menu Item' : 'Activate Menu Item'}
          variant={itemToToggle.status === 'Active' ? 'warning' : 'primary'}
          message={`Are you sure you want to ${itemToToggle.status === 'Active' ? 'deactivate' : 'activate'} "${itemToToggle.name}" (${itemToToggle.code})? ${itemToToggle.status === 'Active' ? 'It will be hidden from instant ordering.' : 'It will become available for order ordering.'}`}
          confirmText={itemToToggle.status === 'Active' ? 'Deactivate' : 'Activate'}
        />
      )}

      {/* Delete Item Modal */}
      {itemToDelete && (
        <ConfirmationModal
          isOpen={Boolean(itemToDelete)}
          onClose={() => setItemToDelete(null)}
          onConfirm={handleConfirmDelete}
          title="Delete Menu Item"
          variant="danger"
          message={`Are you sure you want to delete "${itemToDelete.name}" (${itemToDelete.code})? If this item has existing historical orders, the institutional policy will prevent hard deletion and recommend deactivation instead.`}
          confirmText="Delete Item"
        />
      )}
    </div>
  );
};

export default MenuListPage;
