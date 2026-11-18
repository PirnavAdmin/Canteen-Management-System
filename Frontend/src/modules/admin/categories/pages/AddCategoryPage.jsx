import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useCategories } from '../hooks/useCategories';
import { PageHeader } from '../../../../components/common/PageHeader';
import { Button } from '../../../../components/common/Button';
import { CategoryForm } from '../components/CategoryForm';

export const AddCategoryPage = () => {
  const navigate = useNavigate();
  const { createCategory, categories } = useCategories();

  const handleCreate = async (formData) => {
    const created = await createCategory(formData);
    navigate(`/admin/categories/${created.id}`);
  };

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/admin/categories');
    }
  };

  return (
    <div>
      <PageHeader
        title="Add New Food Category"
        description="Define a new food classification for menu organization (e.g., Breakfast, Meals, Beverages)."
        breadcrumbItems={[
          { label: 'Food Categories', path: '/admin/categories' },
          { label: 'Add Category' }
        ]}
        actions={
          <Button
            variant="secondary"
            icon={ArrowLeft}
            onClick={handleBack}
          >
            Back to Categories
          </Button>
        }
      />

      <CategoryForm
        onSubmit={handleCreate}
        isEdit={false}
        allCategories={categories}
      />
    </div>
  );
};

export default AddCategoryPage;

