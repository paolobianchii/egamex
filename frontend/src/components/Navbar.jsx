import React from 'react';
import { Layout, Button, Input, Badge } from 'antd';
import { NotificationOutlined } from '@ant-design/icons';
import '../styles/Navbar.css'; // Importa il file CSS per la navbar

const { Header } = Layout;

const Navbar = () => {
  return (
    <Header className="navbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>

      <div className="navbar-right" style={{ display: 'flex', alignItems: 'center' }}>
        {/* Icona delle notifiche con Badge */}
        <Badge count={5} showZero>
          <NotificationOutlined style={{ fontSize: '24px', color: '#fff', marginRight: '20px' }} />
        </Badge>

        {/* Bottone Accedi */}
        <Button type="primary" style={{ marginLeft: '10px' }}>
          Accedi
        </Button>
      </div>
    </Header>
  );
};

export default Navbar;
