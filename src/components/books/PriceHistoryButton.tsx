// components/books/PriceHistoryButton.tsx
'use client';

import { useState } from 'react';
import { LineChart } from 'lucide-react';
import Button  from '@/components/ui/button/Button';
import PriceHistoryModal from './PriceHistoryModal';

interface PriceHistoryButtonProps {
  isbn: string;
  className?: string;
}

export default function PriceHistoryButton({ isbn, className = '' }: PriceHistoryButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        className={`flex items-center gap-2 ${className}`}
        onClick={() => setIsModalOpen(true)}
      >
        <LineChart size={16} />
        <span>Price History</span>
      </Button>

      <PriceHistoryModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        isbn={isbn}
      />
    </>
  );
}