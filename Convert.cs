using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace MapCom
{
    public class Convert
    {
        public const int ITEM_MODEL_TKY = 0;

        public const int ITEM_MODEL_GRS80 = 1;

        //public const int model = ITEM_MODEL_GRS80;
        public const int model = ITEM_MODEL_TKY;



        public void ConvW2J(long Mx, long My, ref long pCx, ref long pCy)
        {
            // TODO: この位置にコントロール通知ハンドラ用のコードを追加してください

            double BTokyo, LTokyo, BWGS84, LWGS84;

            LWGS84 = Mx / (double)(3600 * 1000);
            BWGS84 = My / (double)(3600 * 1000);

            BTokyo = BWGS84 + 0.00010696 * BWGS84 - 0.000017467 * LWGS84 - 0.0046020;
            LTokyo = LWGS84 + 0.000046047 * BWGS84 + 0.000083049 * LWGS84 - 0.010041;

            pCx = (long)(LTokyo * 3600 * 1000);
            pCy = (long)(BTokyo * 3600 * 1000);

        }
        public void ConvJ2W(long Mx, long My, ref long pCx, ref long pCy)
        {
            // TODO: この位置にコントロール通知ハンドラ用のコードを追加してください

            double BTokyo, LTokyo, BWGS84, LWGS84;

            LTokyo = Mx / (double)(3600 * 1000);
            BTokyo = My / (double)(3600 * 1000);

            LWGS84 = LTokyo - 0.000046038 * BTokyo - 0.000083043 * LTokyo + 0.010040;
            BWGS84 = BTokyo - 0.00010695 * BTokyo + 0.000017464 * LTokyo + 0.0046017;

            pCx = (long)(LWGS84 * 3600 * 1000);
            pCy = (long)(BWGS84 * 3600 * 1000);

        }

        //
        // 経緯度から正規化座標系へ
        //
        public int gpconv(double m_keido, double m_ido, int kijyunkei, ref double lx, ref double ly)
        {
            double phi, lamda, x, y, phi0, lamda0;

            double KJN_IDO = 0.0;
            double KJN_KDO = 0.0;
            int KJN_IDO1 = 0;
            int KJN_IDO2 = 0;
            int KJN_IDO3 = 0;
            int KJN_IDO4 = 0;
            int KJN_KDO1 = 0;
            int KJN_KDO2 = 0;
            int KJN_KDO3 = 0;
            int KJN_KDO4 = 0;


            switch (kijyunkei)
            {
                case 0:
                case 1:
                    KJN_IDO1 = 33; KJN_IDO2 = 00; KJN_IDO3 = 00; KJN_IDO4 = 00;
                    KJN_KDO1 = 129; KJN_KDO2 = 30; KJN_KDO3 = 00; KJN_KDO4 = 00;
                    break;
                case 2:
                    KJN_IDO1 = 33; KJN_IDO2 = 00; KJN_IDO3 = 00; KJN_IDO4 = 00;
                    KJN_KDO1 = 131; KJN_KDO2 = 00; KJN_KDO3 = 00; KJN_KDO4 = 00;
                    break;
                case 3:
                    KJN_IDO1 = 36; KJN_IDO2 = 00; KJN_IDO3 = 00; KJN_IDO4 = 00;
                    KJN_KDO1 = 132; KJN_KDO2 = 10; KJN_KDO3 = 00; KJN_KDO4 = 00;
                    break;
                case 4:
                    KJN_IDO1 = 33; KJN_IDO2 = 00; KJN_IDO3 = 00; KJN_IDO4 = 00;
                    KJN_KDO1 = 133; KJN_KDO2 = 30; KJN_KDO3 = 00; KJN_KDO4 = 00;
                    break;
                case 5:
                    KJN_IDO1 = 36; KJN_IDO2 = 00; KJN_IDO3 = 00; KJN_IDO4 = 00;
                    KJN_KDO1 = 134; KJN_KDO2 = 20; KJN_KDO3 = 00; KJN_KDO4 = 00;
                    break;
                case 6:
                    KJN_IDO1 = 36; KJN_IDO2 = 00; KJN_IDO3 = 00; KJN_IDO4 = 00;
                    KJN_KDO1 = 136; KJN_KDO2 = 00; KJN_KDO3 = 00; KJN_KDO4 = 00;
                    break;
                case 7:
                    KJN_IDO1 = 36; KJN_IDO2 = 00; KJN_IDO3 = 00; KJN_IDO4 = 00;
                    KJN_KDO1 = 137; KJN_KDO2 = 10; KJN_KDO3 = 00; KJN_KDO4 = 00;
                    break;
                case 8:
                    KJN_IDO1 = 36; KJN_IDO2 = 00; KJN_IDO3 = 00; KJN_IDO4 = 00;
                    KJN_KDO1 = 138; KJN_KDO2 = 30; KJN_KDO3 = 00; KJN_KDO4 = 00;
                    break;
                case 9:
                    KJN_IDO1 = 36; KJN_IDO2 = 00; KJN_IDO3 = 00; KJN_IDO4 = 00;
                    KJN_KDO1 = 139; KJN_KDO2 = 50; KJN_KDO3 = 00; KJN_KDO4 = 00;
                    break;
                case 10:
                    KJN_IDO1 = 40; KJN_IDO2 = 00; KJN_IDO3 = 00; KJN_IDO4 = 00;
                    KJN_KDO1 = 140; KJN_KDO2 = 50; KJN_KDO3 = 00; KJN_KDO4 = 00;
                    break;
                case 11:
                    KJN_IDO1 = 44; KJN_IDO2 = 00; KJN_IDO3 = 00; KJN_IDO4 = 00;
                    KJN_KDO1 = 140; KJN_KDO2 = 15; KJN_KDO3 = 00; KJN_KDO4 = 00;
                    break;
                case 12:
                    KJN_IDO1 = 44; KJN_IDO2 = 00; KJN_IDO3 = 00; KJN_IDO4 = 00;
                    KJN_KDO1 = 142; KJN_KDO2 = 15; KJN_KDO3 = 00; KJN_KDO4 = 00;
                    break;
                case 13:
                    KJN_IDO1 = 44; KJN_IDO2 = 00; KJN_IDO3 = 00; KJN_IDO4 = 00;
                    KJN_KDO1 = 144; KJN_KDO2 = 15; KJN_KDO3 = 00; KJN_KDO4 = 00;
                    break;
                case 14:
                    KJN_IDO1 = 26; KJN_IDO2 = 00; KJN_IDO3 = 00; KJN_IDO4 = 00;
                    KJN_KDO1 = 142; KJN_KDO2 = 00; KJN_KDO3 = 00; KJN_KDO4 = 00;
                    break;
                case 15:
                    KJN_IDO1 = 26; KJN_IDO2 = 00; KJN_IDO3 = 00; KJN_IDO4 = 00;
                    KJN_KDO1 = 127; KJN_KDO2 = 30; KJN_KDO3 = 00; KJN_KDO4 = 00;
                    break;
                case 16:
                    KJN_IDO1 = 26; KJN_IDO2 = 00; KJN_IDO3 = 00; KJN_IDO4 = 00;
                    KJN_KDO1 = 124; KJN_KDO2 = 00; KJN_KDO3 = 00; KJN_KDO4 = 00;
                    break;
                case 17:
                    KJN_IDO1 = 26; KJN_IDO2 = 00; KJN_IDO3 = 00; KJN_IDO4 = 00;
                    KJN_KDO1 = 131; KJN_KDO2 = 00; KJN_KDO3 = 00; KJN_KDO4 = 00;
                    break;
                case 18:
                    KJN_IDO1 = 20; KJN_IDO2 = 00; KJN_IDO3 = 00; KJN_IDO4 = 00;
                    KJN_KDO1 = 136; KJN_KDO2 = 00; KJN_KDO3 = 00; KJN_KDO4 = 00;
                    break;
                case 19:
                    KJN_IDO1 = 26; KJN_IDO2 = 00; KJN_IDO3 = 00; KJN_IDO4 = 00;
                    KJN_KDO1 = 154; KJN_KDO2 = 00; KJN_KDO3 = 00; KJN_KDO4 = 00;
                    break;
            }
            KJN_IDO = (double)3600 * KJN_IDO1 + (double)(60 * KJN_IDO2) + KJN_IDO3 + (double)(0.01 * KJN_IDO4);
            KJN_KDO = (double)3600 * KJN_KDO1 + (double)(60 * KJN_KDO2) + KJN_KDO3 + (double)(0.01 * KJN_KDO4);

            double Ba, Bb, Bc, Bd, Be;
            double A, E, SR, PAI;
            A = 6377397.155;             //'長半径(meter)
            E = 0.006674372231315;       //'離心率の二乗

            if (model == ITEM_MODEL_TKY)
            {
                A = 6377397.155;             //'長半径(meter)
                E = 0.006674372231315;       //'離心率の二乗
            }
            else
            {
                A = 6378137;
                E = 0.006694380022900788;
            }
            
            SR = 206264.806;             //'秒・ラジアン換算係数
            PAI = 3.14159265;

            double b, s, c, c2, c4, t, t2, t4, h2, h4, N, lam2, lamc2, lamc4;
            double x1, x2, y1, y2;

            phi = m_ido;
            lamda = m_keido;

            phi0 = KJN_IDO;
            lamda0 = KJN_KDO;

            //    '秒からラジアンへ
            lamda = lamda - lamda0;
            lamda = PAI / 180 * (lamda / 3600);
            phi = PAI / 180 * (phi / 3600);
            phi0 = PAI / 180 * (phi0 / 3600);

            s = Math.Sin(phi);
            c = Math.Cos(phi);
            c2 = c * c;
            c4 = c2 * c2;
            t = Math.Tan(phi);
            t2 = t * t;
            t4 = t2 * t2;
            h2 = E * c2 / (1 - E);
            h4 = h2 * h2;
            N = A / Math.Sqrt(1 - E * s * s);
            lam2 = lamda * lamda;
            lamc2 = lam2 * c2;
            lamc4 = lamc2 * lamc2;

            double ph1, ph2;
            ph1 = phi0;
            ph2 = phi;

            // <[version3.0_CHA20170104_24 Mod Start]
            //Ba = 1.005037306049 * (ph2 - ph1);
            //Bb = 0.0050478492403 * (sin(2 * ph2) - sin(2 * ph1)) / 2;
            //Bc = 0.0000105637868 * (sin(4 * ph2) - sin(4 * ph1)) / 4;
            //Bd = 0.00000002063332 * (sin(6 * ph2) - sin(6 * ph1)) / 6;
            //Be = 0.000000000038853 * (sin(8 * ph2) - sin(8 * ph1)) / 8;
            if (model == ITEM_MODEL_TKY)
            {
                Ba = 1.005037306049 * (ph2 - ph1);
                Bb = 0.0050478492403 * (Math.Sin(2 * ph2) - Math.Sin(2 * ph1)) / 2;
                Bc = 0.0000105637868 * (Math.Sin(4 * ph2) - Math.Sin(4 * ph1)) / 4;
                Bd = 0.00000002063332 * (Math.Sin(6 * ph2) - Math.Sin(6 * ph1)) / 6;
                Be = 0.000000000038853 * (Math.Sin(8 * ph2) - Math.Sin(8 * ph1)) / 8;
            }
            else
            {
                Ba = 1.005052501813080 * (ph2 - ph1);
                Bb = 0.005063108622224 * (Math.Sin(2 * ph2) - Math.Sin(2 * ph1)) / 2;
                Bc = 0.000010627590263 * (Math.Sin(4 * ph2) - Math.Sin(4 * ph1)) / 4;
                Bd = 0.000000020820379 * (Math.Sin(6 * ph2) - Math.Sin(6 * ph1)) / 6;
                Be = 0.000000000039324 * (Math.Sin(8 * ph2) - Math.Sin(8 * ph1)) / 8;
            }
            // [version3.0_CHA20170104_24 Mod End]>

            b = A * (1 - E) * (Ba - Bb + Bc - Bd + Be);

            x1 = lamc2 * (5 - t2 + 9 * h2 + 4 * h4) / 24;
            x2 = lamc4 * (61 - 58 * t2 + t4 + 270 * h2 - 330 * h2 * t2) / 720;
            y1 = lamc2 * (1 - t2 + h2) / 6;
            y2 = lamc4 * (5 - 18 * t2 + t4 + 14 * h2 - 58 * h2 * t2) / 120;
            x = 0.9999 * (b + N * s * c * lam2 * (0.5 + x1 + x2));
            y = 0.9999 * N * c * lamda * (1 + y1 + y2);

            // y,x 逆
            lx = y;
            ly = x;
            return (0);
        }

        //
        // 正規化座標系から経緯度へ
        //

        public int gpconv2(double lx, double ly, int kijyunkei, ref double m_keido, ref double m_ido)
        {
            double phi, lamda, phi0, lamda0;
            double x, y;

            double KJN_IDO=0.0;
            double KJN_KDO=0.0;
            int KJN_IDO1=0;
            int KJN_IDO2=0;
            int KJN_IDO3=0;
            int KJN_IDO4=0;
            int KJN_KDO1=0;
            int KJN_KDO2=0;
            int KJN_KDO3=0;
            int KJN_KDO4=0;

            switch (kijyunkei)
            {
                case 0:
                case 1:
                    KJN_IDO1 = 33; KJN_IDO2 = 00; KJN_IDO3 = 00; KJN_IDO4 = 00;
                    KJN_KDO1 = 129; KJN_KDO2 = 30; KJN_KDO3 = 00; KJN_KDO4 = 00;
                    break;
                case 2:
                    KJN_IDO1 = 33; KJN_IDO2 = 00; KJN_IDO3 = 00; KJN_IDO4 = 00;
                    KJN_KDO1 = 131; KJN_KDO2 = 00; KJN_KDO3 = 00; KJN_KDO4 = 00;
                    break;
                case 3:
                    KJN_IDO1 = 36; KJN_IDO2 = 00; KJN_IDO3 = 00; KJN_IDO4 = 00;
                    KJN_KDO1 = 132; KJN_KDO2 = 10; KJN_KDO3 = 00; KJN_KDO4 = 00;
                    break;
                case 4:
                    KJN_IDO1 = 33; KJN_IDO2 = 00; KJN_IDO3 = 00; KJN_IDO4 = 00;
                    KJN_KDO1 = 133; KJN_KDO2 = 30; KJN_KDO3 = 00; KJN_KDO4 = 00;
                    break;
                case 5:
                    KJN_IDO1 = 36; KJN_IDO2 = 00; KJN_IDO3 = 00; KJN_IDO4 = 00;
                    KJN_KDO1 = 134; KJN_KDO2 = 20; KJN_KDO3 = 00; KJN_KDO4 = 00;
                    break;
                case 6:
                    KJN_IDO1 = 36; KJN_IDO2 = 00; KJN_IDO3 = 00; KJN_IDO4 = 00;
                    KJN_KDO1 = 136; KJN_KDO2 = 00; KJN_KDO3 = 00; KJN_KDO4 = 00;
                    break;
                case 7:
                    KJN_IDO1 = 36; KJN_IDO2 = 00; KJN_IDO3 = 00; KJN_IDO4 = 00;
                    KJN_KDO1 = 137; KJN_KDO2 = 10; KJN_KDO3 = 00; KJN_KDO4 = 00;
                    break;
                case 8:
                    KJN_IDO1 = 36; KJN_IDO2 = 00; KJN_IDO3 = 00; KJN_IDO4 = 00;
                    KJN_KDO1 = 138; KJN_KDO2 = 30; KJN_KDO3 = 00; KJN_KDO4 = 00;
                    break;
                case 9:
                    KJN_IDO1 = 36; KJN_IDO2 = 00; KJN_IDO3 = 00; KJN_IDO4 = 00;
                    KJN_KDO1 = 139; KJN_KDO2 = 50; KJN_KDO3 = 00; KJN_KDO4 = 00;
                    break;
                case 10:
                    KJN_IDO1 = 40; KJN_IDO2 = 00; KJN_IDO3 = 00; KJN_IDO4 = 00;
                    KJN_KDO1 = 140; KJN_KDO2 = 50; KJN_KDO3 = 00; KJN_KDO4 = 00;
                    break;
                case 11:
                    KJN_IDO1 = 44; KJN_IDO2 = 00; KJN_IDO3 = 00; KJN_IDO4 = 00;
                    KJN_KDO1 = 140; KJN_KDO2 = 15; KJN_KDO3 = 00; KJN_KDO4 = 00;
                    break;
                case 12:
                    KJN_IDO1 = 44; KJN_IDO2 = 00; KJN_IDO3 = 00; KJN_IDO4 = 00;
                    KJN_KDO1 = 142; KJN_KDO2 = 15; KJN_KDO3 = 00; KJN_KDO4 = 00;
                    break;
                case 13:
                    KJN_IDO1 = 44; KJN_IDO2 = 00; KJN_IDO3 = 00; KJN_IDO4 = 00;
                    KJN_KDO1 = 144; KJN_KDO2 = 15; KJN_KDO3 = 00; KJN_KDO4 = 00;
                    break;
                case 14:
                    KJN_IDO1 = 26; KJN_IDO2 = 00; KJN_IDO3 = 00; KJN_IDO4 = 00;
                    KJN_KDO1 = 142; KJN_KDO2 = 00; KJN_KDO3 = 00; KJN_KDO4 = 00;
                    break;
                case 15:
                    KJN_IDO1 = 26; KJN_IDO2 = 00; KJN_IDO3 = 00; KJN_IDO4 = 00;
                    KJN_KDO1 = 127; KJN_KDO2 = 30; KJN_KDO3 = 00; KJN_KDO4 = 00;
                    break;
                case 16:
                    KJN_IDO1 = 26; KJN_IDO2 = 00; KJN_IDO3 = 00; KJN_IDO4 = 00;
                    KJN_KDO1 = 124; KJN_KDO2 = 00; KJN_KDO3 = 00; KJN_KDO4 = 00;
                    break;
                case 17:
                    KJN_IDO1 = 26; KJN_IDO2 = 00; KJN_IDO3 = 00; KJN_IDO4 = 00;
                    KJN_KDO1 = 131; KJN_KDO2 = 00; KJN_KDO3 = 00; KJN_KDO4 = 00;
                    break;
                case 18:
                    KJN_IDO1 = 20; KJN_IDO2 = 00; KJN_IDO3 = 00; KJN_IDO4 = 00;
                    KJN_KDO1 = 136; KJN_KDO2 = 00; KJN_KDO3 = 00; KJN_KDO4 = 00;
                    break;
                case 19:
                    KJN_IDO1 = 26; KJN_IDO2 = 00; KJN_IDO3 = 00; KJN_IDO4 = 00;
                    KJN_KDO1 = 154; KJN_KDO2 = 00; KJN_KDO3 = 00; KJN_KDO4 = 00;
                    break;
            }
            KJN_IDO = (double)3600 * KJN_IDO1 + (double)(60 * KJN_IDO2) + KJN_IDO3 + (double)(0.01 * KJN_IDO4);
            KJN_KDO = (double)3600 * KJN_KDO1 + (double)(60 * KJN_KDO2) + KJN_KDO3 + (double)(0.01 * KJN_KDO4);

            //絶対座標取得
            x = ly;
            y = lx;

            //座標計算
            phi0 = KJN_IDO;
            lamda0 = KJN_KDO;
            //平面直角座標系->極座標系
            double mot, m, s, ab, ph0, ph1, si, co;
            double ri, ni, cr, eta2, t, t2, t4, y1, y2, y4, f1, f2;
            double A, E, SR, PAI;
            double wph1, wph2;
            double Ba;
            double Bb;
            double Bc;
            double Bd;
            double Be;

            // <[version3.0_CHA20170104_24 Mod Start]
            //A = 6377397.155;             //長半径(meter)
            //E = 0.006674372231315;       //離心率の二乗

            if (model == ITEM_MODEL_TKY)
            {
                A = 6377397.155;             //長半径(meter)
                E = 0.006674372231315;       //離心率の二乗
            }
            else
            {
                A = 6378137;
                E = 0.006694380022900788;
            }
            // [version3.0_CHA20170104_24 Mod End]>

            SR = 206264.806;             //秒・ラジアン換算係数
            PAI = 3.14159265358979;

            si = 0;

            //秒からラジアンへ
            lamda0 = PAI / 180 * (lamda0 / 3600);
            phi0 = PAI / 180 * (phi0 / 3600);

            ab = 1;
            ph0 = PAI * 0.2;

            wph1 = 0;
            ///		wph2 = ph0;     20030731
            wph2 = phi0;

            // <[version3.0_CHA20170104_24 Mod Start]
            //Ba = 1.005037306049 * (wph2 - wph1);
            //Bb = 0.0050478492403 * (Math.Sin(2 * wph2) - Math.Sin(2 * wph1)) / 2;
            //Bc = 0.0000105637868 * (Math.Sin(4 * wph2) - Math.Sin(4 * wph1)) / 4;
            //Bd = 0.00000002063332 * (Math.Sin(6 * wph2) - Math.Sin(6 * wph1)) / 6;
            //Be = 0.000000000038853 * (Math.Sin(8 * wph2) - Math.Sin(8 * wph1)) / 8;
            if (model == ITEM_MODEL_TKY)
            {
                Ba = 1.005037306049 * (wph2 - wph1);
                Bb = 0.0050478492403 * (Math.Sin(2 * wph2) - Math.Sin(2 * wph1)) / 2;
                Bc = 0.0000105637868 * (Math.Sin(4 * wph2) - Math.Sin(4 * wph1)) / 4;
                Bd = 0.00000002063332 * (Math.Sin(6 * wph2) - Math.Sin(6 * wph1)) / 6;
                Be = 0.000000000038853 * (Math.Sin(8 * wph2) - Math.Sin(8 * wph1)) / 8;
            }
            else
            {
                Ba = 1.005052501813080 * (wph2 - wph1);
                Bb = 0.005063108622224 * (Math.Sin(2 * wph2) - Math.Sin(2 * wph1)) / 2;
                Bc = 0.000010627590263 * (Math.Sin(4 * wph2) - Math.Sin(4 * wph1)) / 4;
                Bd = 0.000000020820379 * (Math.Sin(6 * wph2) - Math.Sin(6 * wph1)) / 6;
                Be = 0.000000000039324 * (Math.Sin(8 * wph2) - Math.Sin(8 * wph1)) / 8;
            }
            // [version3.0_CHA20170104_24 Mod End]>


            m = x / 0.9999 + A * (1 - E) * (Ba - Bb + Bc - Bd + Be);
            y = y / 0.9999;
            mot = 1 / (A * (1 - E));

            while (ab > 0.00000000000001)
            {
                wph1 = 0;
                wph2 = ph0;
                // <[version3.0_CHA20170104_24 Mod Start]
                //Ba = 1.005037306049 * (wph2 - wph1);
                //Bb = 0.0050478492403 * (Math.Sin(2 * wph2) - Math.Sin(2 * wph1)) / 2;
                //Bc = 0.0000105637868 * (Math.Sin(4 * wph2) - Math.Sin(4 * wph1)) / 4;
                //Bd = 0.00000002063332 * (Math.Sin(6 * wph2) - Math.Sin(6 * wph1)) / 6;
                //Be = 0.000000000038853 * (Math.Sin(8 * wph2) - Math.Sin(8 * wph1)) / 8;
                if (model == ITEM_MODEL_TKY)
                {
                    Ba = 1.005037306049 * (wph2 - wph1);
                    Bb = 0.0050478492403 * (Math.Sin(2 * wph2) - Math.Sin(2 * wph1)) / 2;
                    Bc = 0.0000105637868 * (Math.Sin(4 * wph2) - Math.Sin(4 * wph1)) / 4;
                    Bd = 0.00000002063332 * (Math.Sin(6 * wph2) - Math.Sin(6 * wph1)) / 6;
                    Be = 0.000000000038853 * (Math.Sin(8 * wph2) - Math.Sin(8 * wph1)) / 8;
                }
                else
                {
                    Ba = 1.005052501813080 * (wph2 - wph1);
                    Bb = 0.005063108622224 * (Math.Sin(2 * wph2) - Math.Sin(2 * wph1)) / 2;
                    Bc = 0.000010627590263 * (Math.Sin(4 * wph2) - Math.Sin(4 * wph1)) / 4;
                    Bd = 0.000000020820379 * (Math.Sin(6 * wph2) - Math.Sin(6 * wph1)) / 6;
                    Be = 0.000000000039324 * (Math.Sin(8 * wph2) - Math.Sin(8 * wph1)) / 8;
                }
                // [version3.0_CHA20170104_24 Mod End]>

                s = A * (1 - E) * (Ba - Bb + Bc - Bd + Be);
                si = Math.Sin(ph0);
                ph1 = ph0 + (m - s) * (Math.Pow((1 - E * si * si), 1.5)) * mot;
                ab = ph1 - ph0;
                ph0 = ph1;
                if (ab < 0)
                {
                    ab = -1 * ab;
                }
            }

            co = Math.Cos(ph0);
            cr = Math.Sqrt(1 - E * si * si);
            ni = cr / A;
            ri = cr * cr * cr * mot;
            eta2 = (co * co) * E / (1 - E);
            t = Math.Tan(ph0);
            t2 = t * t;
            t4 = t2 * t2;
            y1 = y * ni;
            y2 = y1 * y1;
            y4 = y2 * y2;
            f1 = -8.33333333333333E-02 * y2 * (5 + 3 * t2 + eta2 - 9 * t2 * eta2);
            f2 = 2.77777777777778E-03 * y4 * (61 + 90 * t2 + 45 * t4);
            phi = ph0 - 0.5 * y * y1 * ri * t * (1 + f1 + f2);
            phi = phi * 180 / PAI * 3600;
            f1 = -0.166666666666667 * y2 * (1 + 2 * t2 + eta2);
            f2 = 8.33333333333333E-03 * y4 * (5 + 28 * t2 + 24 * t4);
            lamda = lamda0 + y1 / co * (1 + f1 + f2);
            lamda = lamda * 180 / PAI * 3600;

            m_keido = lamda;
            m_ido = phi;
            return 0;
        }
    }
}
