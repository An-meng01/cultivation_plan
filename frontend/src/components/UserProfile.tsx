// 右上角用户信息：展示头像与用户名，点击头像可上传本地头像。
// 头像上传后进入"待审核(pending)"状态，需管理员审核通过(approved)后才对外展示（管理员功能暂未实现）。
import { useState } from 'react';
import { Avatar, Badge, Modal, Upload, Button, message, Tooltip } from 'antd';
import { UserOutlined, UploadOutlined } from '@ant-design/icons';
import type { UploadProps } from 'antd';
import { uploadAvatar } from '../services/api';

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function UserProfile() {
  const [avatar, setAvatar] = useState(localStorage.getItem('avatar') || '');
  const [avatarStatus, setAvatarStatus] = useState(localStorage.getItem('avatarStatus') || 'none');
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const username = localStorage.getItem('username') || '';

  const beforeUpload: UploadProps['beforeUpload'] = async (file) => {
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      message.error('请选择图片文件');
      return Upload.LIST_IGNORE;
    }
    const isLt2M = file.size / 1024 / 1024 < 2;
    if (!isLt2M) {
      message.error('图片需小于 2MB');
      return Upload.LIST_IGNORE;
    }
    setUploading(true);
    try {
      const dataUrl = await readFileAsDataURL(file as unknown as File);
      const res = await uploadAvatar(dataUrl);
      if (res.code === 0 && res.data) {
        localStorage.setItem('avatar', res.data.avatarUrl);
        localStorage.setItem('avatarStatus', res.data.avatarStatus);
        setAvatar(res.data.avatarUrl);
        setAvatarStatus(res.data.avatarStatus);
        message.success('头像已提交，等待管理员审核');
        setOpen(false);
      } else {
        message.error(res.message || '上传失败');
      }
    } catch (e: any) {
      message.error(e?.message || '上传失败');
    } finally {
      setUploading(false);
    }
    return Upload.LIST_IGNORE;
  };

  const pending = avatarStatus === 'pending';

  return (
    <>
      <div
        style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}
        onClick={() => setOpen(true)}
      >
        <Badge dot={pending} color="#faad14" offset={[-4, 4]}>
          <Avatar
            size={36}
            src={avatar || undefined}
            icon={<UserOutlined />}
            style={{ backgroundColor: avatar ? 'transparent' : '#ff85c0' }}
          />
        </Badge>
        <span style={{ maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {username}
        </span>
        {pending && (
          <Tooltip title="头像已提交，等待管理员审核">
            <span style={{ fontSize: 12, color: '#faad14' }}>审核中</span>
          </Tooltip>
        )}
      </div>

      <Modal
        title="上传头像"
        open={open}
        onCancel={() => setOpen(false)}
        footer={null}
      >
        <p style={{ color: '#888', fontSize: 13, marginBottom: 16 }}>
          选择本地图片上传，提交后将进入「待审核」状态，由管理员审核通过后展示（管理员功能暂未实现）。
        </p>
        <Upload
          accept="image/*"
          showUploadList={false}
          beforeUpload={beforeUpload}
          maxCount={1}
        >
          <Button icon={<UploadOutlined />} loading={uploading} block>
            选择图片并上传
          </Button>
        </Upload>
        {avatar && (
          <div style={{ marginTop: 16, textAlign: 'center' }}>
            <Avatar size={80} src={avatar} icon={<UserOutlined />} />
            <div style={{ marginTop: 8, fontSize: 12, color: '#888' }}>
              当前{pending ? '（审核中）' : ''}
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
