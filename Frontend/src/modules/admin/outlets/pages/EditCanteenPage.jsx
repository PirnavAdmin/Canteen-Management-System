import React, { useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useCanteens } from '../hooks/useCanteens';
import { PageHeader } from '../../../../components/common/PageHeader';
import { CanteenForm } from '../components/CanteenForm';
import { EmptyState } from '../../../../components/common/EmptyState';
import { Button } from '../../../../components/common/Button';
import { Store, ArrowLeft } from 'lucide-react';

export const EditCanteenPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getCanteen, updateCanteen, canteens, loading } = useCanteens();

  const canteen = useMemo(() => getCanteen(id), [getCanteen, id]);

  const handleUpdate = async (formData) => {
    await updateCanteen(id, formData);
    navigate(`/admin/outlets/${id}`);
  };

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/admin/outlets');
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '48px', textAlign: 'center', color: 'var(--text-secondary)' }}>
        Loading canteen details...
      </div>
    );
  }

  if (!canteen) {
    return (
      <div>
        <PageHeader
          title="Edit Canteen Outlet"
          breadcrumbItems={[
            { label: 'Canteen Outlets', path: '/canteen' },
            { label: 'Edit Outlet' }
          ]}
        />
        <EmptyState
          icon={Store}
          title="Outlet Not Found"
          message={`No canteen outlet found matching identifier "${id}". It may have been removed.`}
          actionLabel="Return to Canteen List"
          onAction={() => navigate('/canteen')}
        />
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title={`Edit Canteen: ${canteen.name}`}
        description={`Modify operational hours, campus assignment, contact records, or working days for ${canteen.code}.`}
        breadcrumbItems={[
          { label: 'Canteen Outlets', path: '/admin/outlets' },
          { label: canteen.name, path: `/canteen/${id}` },
          { label: 'Edit' }
        ]}
        actions={
          <Button
            variant="secondary"
            icon={ArrowLeft}
            onClick={handleBack}
          >
            Back to Outlets
          </Button>
        }
      />

      <CanteenForm
        initialValues={canteen}
        onSubmit={handleUpdate}
        isEdit={true}
        allCanteens={canteens}
      />
    </div>
  );
};

export default EditCanteenPage;

