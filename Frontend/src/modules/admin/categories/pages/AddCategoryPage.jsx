import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCategories } from '../hooks/useCategories';
import { PageHeader } from '../../../../components/common/PageHeader';
import { CategoryForm } from '../components/CategoryForm';

export const AddCategoryPage = () => {
  const navigate = useNavigate();
  const { createCategory, categories } = useCategories();

  const handleCreate = async (formData) => {
    const created = await createCategory(formData);
    navigate(`/categories/${created.id}`);
  };

  return (
    <div>
      <PageHeader
        title="Add New Food Category"
        description="Define a new food classification for menu organization (e.g., Breakfast, Meals, Beverages)."
        breadcrumbItems={[
          { label: 'Food Categories', path: '/categories' },
          { label: 'Add Category' }
        ]}
      />

      <CategoryForm
        onSubmit={handleCreate}
        isEdit={false}
        allCategories={categories}
      />
    </div>
  );
};

