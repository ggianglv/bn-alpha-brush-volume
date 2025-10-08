import React from 'react';
import { Popover, TextInput } from '@mantine/core';
import { IconSettings } from '@tabler/icons-react';

const Setting = () => {
  return (
    <Popover width={300} trapFocus position="top-end" withArrow shadow="md">
      <Popover.Target>
        <IconSettings size={20} style={{ cursor: 'pointer', flexShrink: 0, color: '#ffffff' }} />
      </Popover.Target>
      <Popover.Dropdown>
        <TextInput label="Name" placeholder="Name" size="xs" />
        <TextInput label="Email" placeholder="john@doe.com" size="xs" mt="xs" />
      </Popover.Dropdown>
    </Popover>
  );
};

export default Setting;
