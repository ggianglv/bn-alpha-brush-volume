import React from 'react';
import { Button } from '@mantine/core';

const QuickSell = () => {
  const handleClick = () => {
    console.log('quick sell clicked');
  };

  return (
    <Button fullWidth onClick={handleClick} color="#F6465D">
      Quick Sell
    </Button>
  );
};

export default QuickSell;
