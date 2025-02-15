import React from 'react';
import { Row, Col, Typography, Divider } from 'antd';
import { FacebookOutlined, TwitterOutlined, InstagramOutlined, DiscordOutlined, XOutlined } from '@ant-design/icons';

const { Title, Text } = Typography;

const Footer = () => {
  return (
    <footer style={{ backgroundColor: '#0f0e17', color: '#ffffff', padding: '40px 0', marginTop:60 }}>
      <div className="container" style={{ padding: '0 20px' }}>
        <Row gutter={[16, 24]} justify="space-between">
          
          {/* Info e Contatti */}
          <Col xs={24} sm={12} md={8}>
            <Title level={3} style={{ color: '#ffffff' }}>Info e Contatti</Title>
            <Text style={{ color: '#ffffff' }}>📍 Indirizzo: Via Roma 123, Milano, IT</Text><br />
            <Text style={{ color: '#ffffff' }}>📧 Email: info@azienda.com</Text><br />
            <Text style={{ color: '#ffffff' }}>📞 Telefono: +39 123 456 789</Text>
          </Col>

          {/* P.IVA e Policy */}
          <Col xs={24} sm={12} md={8}>
            <Title level={3} style={{ color: '#ffffff' }}>P.IVA e Policy</Title>
            <Text style={{ color: '#ffffff', textAlign:"center" }}>
            EgameX: piattaforma innovativa dedicata alla community e al coaching del mondo gaming. 
          Progetto finanziato dalla Regione Lazio, con contributo di 30.000€ tramite bando POR FESR Pre Seed Plus.
        </Text><br /><br/>
            <Text style={{ color: '#ffffff' }}>
              <img style={{height:25}} src = "https://www.egamex.eu/public/assets/images/footer/preseed_banner.webp"></img>
            </Text>
          </Col>

          {/* Social Media Links */}
          <Col xs={24} sm={12} md={8}>
            <Title level={3} style={{ color: '#ffffff' }}>Seguici sui Social</Title>
            <Row gutter={[16, 16]} justify="start">
              <Col>
                <a href="https://discord.com/invite/xtZFtMKZez/" target="_blank" rel="noopener noreferrer">
                  <DiscordOutlined style={{ fontSize: '24px', color: '#3b5998' }} />
                </a>
              </Col>
              <Col>
                <a href="https://x.com/i/flow/login?redirect_after_login=%2FeGameX_Official%2F" target="_blank" rel="noopener noreferrer">
                  <XOutlined style={{ fontSize: '24px', color: '#00acee' }} />
                </a>
              </Col>
              <Col>
                <a href="https://www.instagram.com/egamex.eu/" target="_blank" rel="noopener noreferrer">
                  <InstagramOutlined style={{ fontSize: '24px', color: '#e4405f' }} />
                </a>
              </Col>
            </Row>
          </Col>
        </Row>

        <Divider style={{ backgroundColor: '#4d4d4d' }} />

        {/* Copyright */}
        <Row justify="center">
          <Col>
            <Text style={{ color: '#ffffff' }}>
              &copy; 2025 Azienda Srl. Tutti i diritti riservati.
            </Text>
          </Col>
        </Row>
      </div>
    </footer>
  );
};

export default Footer;
