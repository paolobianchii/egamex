import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Input,
  Button,
  Checkbox,
  Form,
  message,
  Typography,
  Spin,
  Select,
  Row,
  Col,
  Table,
  Modal,
  Popconfirm,
  Layout,
} from "antd";
import { Content } from "antd/es/layout/layout";

function GestioneAdmin() {
  return (
    <Layout style={{ minHeight: "100vh" }}>
      <Layout style={{ padding: "0 4px 4px", backgroundColor: "#191029" }}>
        <Content
          style={{
            padding: 24,
            margin: 0,
            minHeight: 280,
            marginTop: 70,
            marginBottom: 30,
          }}
        >
        <h1 style={{ color: "#fff" }}>Admin</h1>

        </Content>
      </Layout>
    </Layout>
  );
}

export default GestioneAdmin;
