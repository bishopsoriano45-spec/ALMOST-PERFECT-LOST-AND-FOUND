import EnhancedItemUpload from '@/components/EnhancedItemUpload';
import { Item } from '@/types';
import { useNavigate } from 'react-router-dom';

export default function EnhancedReportLost() {
  const navigate = useNavigate();

  const handleItemCreated = (item: Item) => {
    // Navigate to item detail page or dashboard
    navigate(`/item/${item.id}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <EnhancedItemUpload 
        type="lost" 
        onItemCreated={handleItemCreated}
      />
    </div>
  );
}