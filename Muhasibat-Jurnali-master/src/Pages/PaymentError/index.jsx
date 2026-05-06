import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import styles from './index.module.scss';
import ErrorIcon from '@mui/icons-material/Error';

const PaymentError = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  
  // URL parametrelerinden bilgileri al
  const orderId = searchParams.get('order_id');
  const transactionId = searchParams.get('transaction_id');
  const message = searchParams.get('message');

  useEffect(() => {
    document.title = 'Ödəniş Uğursuz';
  }, []);

  return (
    <div className={styles.paymentPage}>
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={styles.iconWrapper}>
            <ErrorIcon className={styles.errorIcon} />
          </div>
          
          <h1 className={styles.title}>Ödəniş Uğursuz Oldu</h1>
          <p className={styles.message}>
            Ödəniş uğursuz oldu. Zəhmət olmasa, kart məlumatlarınızı yoxlayın 
            və ya başqa bir kartla cəhd edin.
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

          {transactionId && (
            <div className={styles.details}>
              <p className={styles.detailLabel}>Əməliyyat nömrəsi:</p>
              <p className={styles.detailValue}>{transactionId}</p>
            </div>
          )}

          <div className={styles.infoBox}>
            <h3>Nə edə bilərsiniz?</h3>
            <ul>
              <li>Kart məlumatlarınızı yoxlayın</li>
              <li>Kartınızda kifayət qədər balans olduğundan əmin olun</li>
              <li>Başqa bir ödəniş üsulu ilə cəhd edin</li>
              <li>Problemlər davam edərsə, bankınızla əlaqə saxlayın</li>
            </ul>
          </div>

          <div className={styles.actions}>
            <button 
              className={styles.primaryButton}
              onClick={() => navigate('/')}
            >
              Yenidən cəhd et
            </button>
            <button 
              className={styles.secondaryButton}
              onClick={() => navigate('/')}
            >
              Ana səhifəyə qayıt
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentError;

