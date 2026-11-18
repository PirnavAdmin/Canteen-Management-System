import React, { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCategories } from '../hooks/useCategories';
import { PageHeader } from '../../../../components/common/PageHeader';
import { CategoryForm } from '../components/CategoryForm';
import { EmptyState } from '../../../../components/common/EmptyState';
import { Button } from '../../../../components/common/Button';
import { LayoutGrid, ArrowLeft } from 'lucide-react';

export const EditCategoryPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getCategory, updateCategory, categories, loading } = useCategories();

  const category = useMemo(() => getCategory(id), [getCategory, id]);

  const handleUpdate = async (formData) => {
    await updateCategory(id, formData);
    navigate(`/admin/categories/${id}`);
  };

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/admin/categories');
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-secondary)' }}>
        Loading category details...
      </div>
    );
  }

  if (!category) {
    return (
      <div>
        <PageHeader
          title="Edit Food Category"
          breadcrumbItems={[
            { label: 'Food Categories', path: '/admin/categories' },
            { label: 'Edit' }
          ]}
        />
        <EmptyState
          icon={LayoutGrid}
          title="Category Not Found"
          message={`No food category found with identifier "${id}".`}
          actionLabel="Return to Categories List"
          onAction={() => navigate('/admin/categories')}
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={`Edit Category: ${category.name}`}
        description={`Modify menu display order #${category.displayOrder}, active state, or description.`}
        breadcrumbItems={[
          { label: 'Food Categories', path: '/admin/categories' },
          { label: category.name, path: `/admin/categories/${id}` },
          { label: 'Edit' }
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
        initialValues={category}
        onSubmit={handleUpdate}
        isEdit={true}
        allCategories={categories}
      />
    </div>
  );
};

export default EditCategoryPage;

