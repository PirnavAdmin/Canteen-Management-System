import React, { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCategories } from '../hooks/useCategories';
import { PageHeader } from '../../../components/common/PageHeader';
import { Button } from '../../../components/common/Button';
import { StatusBadge } from '../../../components/common/StatusBadge';
import { Card } from '../../../components/common/Card';
import { ConfirmationModal } from '../../../components/common/ConfirmationModal';
import { formatDate } from '../utils/categoryFormatters';
import {
  Edit,
  ArrowLeft,
  Power,
  LayoutGrid,
  ListOrdered,
  FileText,
  ShieldCheck,
  ShieldAlert,
  UtensilsCrossed,
  Receipt
} from 'lucide-react';

export const CategoryDetailsPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getCategory, toggleCategoryStatus, loading } = useCategories();

  const [isToggleModalOpen, setIsToggleModalOpen] = useState(false);

  const category = useMemo(() => getCategory(id), [getCategory, id]);

  if (loading) {
    return (
      <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-secondary)' }}>
        Loading category specifications...
      </div>
    );
  }

  if (!category) {
    return (
      <div>
        <PageHeader
          title="Category Details"
          breadcrumbItems={[
            { label: 'Food Categories', path: '/categories' },
            { label: 'Details' }
          ]}
        />
        <Card>
          <div style={{ textAlign: 'center', padding: '32px' }}>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '16px' }}>
              The requested food category does not exist or may have been deleted.
            </p>
            <Button variant="primary" onClick={() => navigate('/categories')}>
              Return to Category List
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  const isActive = category.status === 'Active';

  const handleConfirmToggle = async () => {
    await toggleCategoryStatus(category.id);
    setIsToggleModalOpen(false);
  };

  return (
    <div>
      <PageHeader
        title={category.name}
        description={`Display Order Rank: #${category.displayOrder} • Category ID: ${category.id}`}
        badge={<StatusBadge status={category.status} />}
        breadcrumbItems={[
          { label: 'Food Categories', path: '/categories' },
          { label: category.name }
        ]}
        actions={
          <>
            <Button
              variant="secondary"
              icon={ArrowLeft}
              onClick={() => navigate('/categories')}
            >
              Back to List
            </Button>
            <Button
              variant="outline"
              icon={Power}
              onClick={() => setIsToggleModalOpen(true)}
              style={{
                color: isActive ? 'var(--color-danger)' : 'var(--color-success)',
                borderColor: isActive ? 'var(--color-danger)' : 'var(--color-success)'
              }}
            >
              {isActive ? 'Deactivate Category' : 'Activate Category'}
            </Button>
            <Button
              variant="primary"
              icon={Edit}
              onClick={() => navigate(`/categories/${id}/edit`)}
            >
              Edit Category
            </Button>
          </>
        }
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', marginBottom: '24px' }}>
        {/* Specification Card */}
        <Card title="Category Master Information">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <LayoutGrid size={18} style={{ color: 'var(--color-accent)', marginTop: '2px', flexShrink: 0 }} />
              <div>
                <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
                  Category Name
                </span>
                <p style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', margin: '2px 0 0 0' }}>
                  {category.name}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <ListOrdered size={18} style={{ color: 'var(--color-accent)', marginTop: '2px', flexShrink: 0 }} />
              <div>
                <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
                  Display Sorting Priority
                </span>
                <div style={{ marginTop: '4px' }}>
                  <span style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    padding: '3px 10px',
                    borderRadius: 'var(--border-radius-full)',
                    backgroundColor: 'var(--color-primary-light)',
                    color: 'var(--color-primary)',
                    fontSize: '13px',
                    fontWeight: 700
                  }}>
                    Rank #{category.displayOrder}
                  </span>
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginLeft: '8px' }}>
                    (Lower ranks render first on customer menu screens)
                  </span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <FileText size={18} style={{ color: 'var(--color-accent)', marginTop: '2px', flexShrink: 0 }} />
              <div>
                <span style={{ fontSize: '11.5px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', fontWeight: 600 }}>
                  Operating Description
                </span>
                <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', margin: '4px 0 0 0', lineHeight: 1.5 }}>
                  {category.description || 'No descriptive notes added for this category.'}
                </p>
              </div>
            </div>
          </div>
        </Card>

        {/* Historical Dependency & Institutional Rule Card */}
        <Card title="Historical Audit Dependencies (SRS §3.2)">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              padding: '14px',
              backgroundColor: 'var(--color-warning-bg)',
              border: '1px solid var(--color-warning-border)',
              borderRadius: 'var(--border-radius-md)'
            }}>
              <ShieldAlert size={18} style={{ color: 'var(--color-warning)', marginTop: '2px', flexShrink: 0 }} />
              <div style={{ fontSize: '12.5px', color: 'var(--color-warning-text)', lineHeight: 1.4 }}>
                <strong>Strict Business Rule:</strong> Categories with historical food item or order dependencies must not be permanently deleted. Use deactivation instead to preserve financial ledgers.
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '4px' }}>
              <div style={{
                padding: '14px',
                borderRadius: 'var(--border-radius-md)',
                backgroundColor: 'var(--bg-app)',
                border: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <UtensilsCrossed size={20} style={{ color: 'var(--color-accent)' }} />
                <div>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {category.linkedItemCount || 0}
                  </div>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                    Linked Food Items
                  </div>
                </div>
              </div>

              <div style={{
                padding: '14px',
                borderRadius: 'var(--border-radius-md)',
                backgroundColor: 'var(--bg-app)',
                border: '1px solid var(--border-color)',
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <Receipt size={20} style={{ color: '#059669' }} />
                <div>
                  <div style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    {category.historicalOrderCount || 0}
                  </div>
                  <div style={{ fontSize: '11.5px', color: 'var(--text-muted)' }}>
                    Historical Orders
                  </div>
                </div>
              </div>
            </div>

            <div style={{ fontSize: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <ShieldCheck size={14} style={{ color: 'var(--color-success)' }} />
              <span>Safe for deactivation and menu rearrangement anytime.</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Audit Metadata Footer */}
      <div style={{
        padding: '16px 20px',
        backgroundColor: '#ffffff',
        borderRadius: 'var(--border-radius-md)',
        border: '1px solid var(--border-color)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        fontSize: '12px',
        color: 'var(--text-muted)'
      }}>
        <span>Institution: <strong>{category.institutionId || 'INST-APEX-01'}</strong></span>
        <span>Registered On: <strong>{formatDate(category.createdAt)}</strong></span>
        <span>Last Updated: <strong>{formatDate(category.updatedAt)}</strong></span>
      </div>

      {/* Confirmation Modal */}
      <ConfirmationModal
        isOpen={isToggleModalOpen}
        onClose={() => setIsToggleModalOpen(false)}
        onConfirm={handleConfirmToggle}
        title={isActive ? 'Deactivate Food Category' : 'Activate Food Category'}
        variant={isActive ? 'warning' : 'primary'}
        message={
          isActive
            ? `Are you sure you want to deactivate "${category.name}"? It will hide this category section from active dining menu schedules while preserving all past order and pricing history.`
            : `Are you sure you want to activate "${category.name}"? It will restore this category to active menu scheduling.`
        }
        confirmText={isActive ? 'Deactivate Category' : 'Activate Category'}
      />
    </div>
  );
};
