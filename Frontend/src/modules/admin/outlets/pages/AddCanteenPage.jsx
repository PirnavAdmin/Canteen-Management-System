import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { useCanteens } from '../hooks/useCanteens';
import { PageHeader } from '../../../../components/common/PageHeader';
import { Button } from '../../../../components/common/Button';
import { CanteenForm } from '../components/CanteenForm';

export const AddCanteenPage = () => {
  const navigate = useNavigate();
  const { createCanteen, canteens } = useCanteens();

  const handleCreate = async (formData) => {
    const created = await createCanteen(formData);
    navigate(`/admin/outlets/${created.id}`);
  };

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate('/admin/outlets');
    }
  };

  return (
    <div>
      <PageHeader
        title="Add New Canteen Outlet"
        description="Register a new institutional dining facility, food court, or cafeteria in the university system."
        breadcrumbItems={[
          { label: 'Canteen Outlets', path: '/admin/outlets' },
          { label: 'Add Canteen' }
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
        onSubmit={handleCreate}
        isEdit={false}
        allCanteens={canteens}
      />
    </div>
  );
};

export default AddCanteenPage;

