import React, { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCategories } from '../hooks/useCategories';
import { PageHeader } from '../../../../components/common/PageHeader';
import { CategoryForm } from '../components/CategoryForm';
import { EmptyState } from '../../../../components/common/EmptyState';
import { LayoutGrid } from 'lucide-react';

export const EditCategoryPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getCategory, updateCategory, categories, loading } = useCategories();

  const category = useMemo(() => getCategory(id), [getCategory, id]);

  const handleUpdate = async (formData) => {
    await updateCategory(id, formData);
    navigate(`/categories/${id}`);
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
            { label: 'Food Categories', path: '/categories' },
            { label: 'Edit' }
          ]}
        />
        <EmptyState
          icon={LayoutGrid}
          title="Category Not Found"
          message={`No food category found with identifier "${id}".`}
          actionLabel="Return to Categories List"
          onAction={() => navigate('/categories')}
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
          { label: 'Food Categories', path: '/categories' },
          { label: category.name, path: `/categories/${id}` },
          { label: 'Edit' }
        ]}
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

