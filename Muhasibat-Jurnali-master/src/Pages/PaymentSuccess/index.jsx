import { useContext, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import styles from './index.module.scss';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import dataContext from '../../Contexts/GlobalState';
import axios from 'axios';
import Base_Url_Server from '../../Constants/baseUrl';

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const store = useContext(dataContext);
  
  // URL parametrelerinden bilgileri al
  const orderId = searchParams.get('order_id');
  const transactionId = searchParams.get('transaction_id');
  const message = searchParams.get('message');
  const amount = searchParams.get('amount');
  
  // Ödəniş növünü müəyyən et
  const isSubscription = orderId && orderId.startsWith('SUBSCRIPTION_');
  const isSinglePdf = orderId && orderId.startsWith('SINGLE-PDF_');

  useEffect(() => {
    document.title = 'Ödəniş Uğurlu';
    
    // User məlumatlarını yenidən yüklə (subscription və purchased PDFs update olsun)
    const refreshUserData = async () => {
      const token = localStorage.getItem('token');
      const userId = localStorage.getItem('user');
      
      if (token && userId) {
        try {
          const response = await axios.get(`${Base_Url_Server}users/${userId}`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          store.user.setData(response.data.data.user);
          console.log('✅ User məlumatları yeniləndi');
        } catch (error) {
          console.error('User məlumatları yenilənərkən xəta:', error);
        }
      }
    };
    
    refreshUserData();
  }, []);

  return (
    <div className={styles.paymentPage}>
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.iconWrapper}>
            <CheckCircleIcon className={styles.successIcon} />
          </div>
          
          <h1 className={styles.title}>Təbrik edirik!</h1>
          <p className={styles.message}>
            {isSubscription 
              ? 'Abunəliyiniz uğurla aktivləşdirildi. Bütün PDF-lərə access əldə etdiniz!'
              : isSinglePdf 
                ? 'PDF uğurla alındı və artıq əlinizdədir!'
                : 'Ödənişiniz uğurla tamamlandı.'
            }
          </p>

          {message && (
            <p className={styles.additionalMessage}>{message}</p>
          )}

          {orderId && (
            <div className={styles.details}>
              <p className={styles.detailLabel}>Sifariş nömrəsi:</p>
              <p className={styles.detailValue}>{orderId}</p>
            </div>
          )}

          {amount && (
            <div className={styles.details}>
              <p className={styles.detailLabel}>Ödənilən məbləğ:</p>
              <p className={styles.detailValue}>{amount} AZN</p>
            </div>
          )}

          {transactionId && (
            <div className={styles.details}>
              <p className={styles.detailLabel}>Əməliyyat nömrəsi:</p>
              <p className={styles.detailValue}>{transactionId}</p>
            </div>
          )}

          <div className={styles.actions}>
            <button 
              className={styles.primaryButton}
              onClick={() => navigate('/profile', { state: { scrollToPdfs: true } })}
            >
              📚 PDF-lərə Keç
            </button>
            <button 
              className={styles.secondaryButton}
              onClick={() => navigate('/')}
            >
              Kitabxanaya get
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentSuccess;

