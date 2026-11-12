import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCanteens } from '../hooks/useCanteens';
import { PageHeader } from '../../../../components/common/PageHeader';
import { CanteenForm } from '../components/CanteenForm';

export const AddCanteenPage = () => {
  const navigate = useNavigate();
  const { createCanteen, canteens } = useCanteens();

  const handleCreate = async (formData) => {
    const created = await createCanteen(formData);
    navigate(`/canteen/${created.id}`);
  };

  return (
    <div>
      <PageHeader
        title="Add New Canteen Outlet"
        description="Register a new institutional dining facility, food court, or cafeteria in the university system."
        breadcrumbItems={[
          { label: 'Canteen Outlets', path: '/canteen' },
          { label: 'Add Canteen' }
        ]}
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

