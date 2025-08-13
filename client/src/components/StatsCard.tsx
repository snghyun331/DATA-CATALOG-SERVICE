import React, { useState, useEffect } from "react";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface StatsCardProps {
  value: string;
  label: string;
  icon: React.ReactNode;
  change?: number; // 증감률 (퍼센트)
  changeType?: "increase" | "decrease" | "unchanged";
  additionalIcon?: React.ReactNode; // 추가 작은 아이콘
  enableAnimation?: boolean; // 애니메이션 활성화 여부
}

const StatsCard: React.FC<StatsCardProps> = ({ value, label, icon, change, changeType, additionalIcon, enableAnimation = false }) => {
  const [displayValue, setDisplayValue] = useState(enableAnimation ? '0' : value);
  
  useEffect(() => {
    if (!enableAnimation || isNaN(Number(value))) {
      setDisplayValue(value);
      return;
    }

    const numValue = Number(value);
    if (numValue === 0) {
      setDisplayValue('0');
      return;
    }

    const duration = 1000; // 1초 애니메이션
    const startTime = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      if (progress < 1) {
        // 끝까지 최종값의 자릿수 범위에서 랜덤하게 올라갔다 내려갔다
        const getRandomInRange = (targetValue) => {
          if (targetValue < 10) {
            // 한자리: 1~9
            return Math.floor(Math.random() * 9) + 1;
          } else if (targetValue < 100) {
            // 두자리: 10~99
            return Math.floor(Math.random() * 90) + 10;
          } else if (targetValue < 1000) {
            // 세자리: 100~999
            return Math.floor(Math.random() * 900) + 100;
          } else if (targetValue < 10000) {
            // 네자리: 1000~9999
            return Math.floor(Math.random() * 9000) + 1000;
          } else {
            // 그 이상: 최종값의 50%~150% 범위에서 랜덤
            const min = Math.floor(targetValue * 0.5);
            const max = Math.floor(targetValue * 1.5);
            return Math.floor(Math.random() * (max - min + 1)) + min;
          }
        };
        
        const randomValue = getRandomInRange(numValue);
        setDisplayValue(randomValue.toString());
      }
      
      if (progress < 1) {
        // 빠른 속도로 고정 (30ms 간격)
        setTimeout(animate, 30);
      } else {
        setDisplayValue(numValue.toString());
      }
    };
    
    // 즉시 시작
    animate();
    
  }, [value, enableAnimation]);
  const renderTopRightIndicator = () => {
    // 증감률이 있으면 증감률 표시, 없으면 추가 아이콘 표시
    if (change !== undefined && changeType !== undefined) {
      const getChangeStyle = () => {
        switch (changeType) {
          case "increase":
            return "text-green-600 bg-green-50 border-green-200";
          case "decrease":
            return "text-red-600 bg-red-50 border-red-200";
          case "unchanged":
            return "text-gray-600 bg-gray-50 border-gray-200";
          default:
            return "text-gray-600 bg-gray-50 border-gray-200";
        }
      };

      const getChangeIcon = () => {
        switch (changeType) {
          case "increase":
            return <TrendingUp size={12} />;
          case "decrease":
            return <TrendingDown size={12} />;
          case "unchanged":
            return <Minus size={12} />;
          default:
            return <Minus size={12} />;
        }
      };

      return (
        <div className={`absolute top-3 right-3 flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium border ${getChangeStyle()}`}>
          {getChangeIcon()}
          <span>{Math.abs(change)}%</span>
        </div>
      );
    } else if (additionalIcon) {
      return (
        <div className="absolute top-3 right-3 p-2 bg-blue-50 rounded-full border border-blue-200">
          {React.cloneElement(additionalIcon as React.ReactElement, { 
            size: 14,
            className: "text-blue-600"
          })}
        </div>
      );
    }
    
    return null;
  };
  return (
    <div className="group relative bg-gradient-to-br from-white to-gray-50 rounded-2xl p-6 shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 min-h-[180px]">
      {/* 배경 장식 */}
      <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-blue-50 to-transparent rounded-2xl opacity-60"></div>
      
      {/* 우상단 표시기 (증감률 또는 추가 아이콘) */}
      {renderTopRightIndicator()}
      
      <div className="relative flex flex-col justify-between text-center h-full py-2">
        {/* 숫자 - 강조된 디자인 */}
        <div className="flex-1 flex items-center justify-center">
          <div className="relative">
            <div className="font-extrabold bg-gradient-to-br from-gray-700 via-gray-800 to-gray-900 bg-clip-text text-transparent drop-shadow-lg" style={{ fontSize: '2.75rem' }}>
              {isNaN(Number(displayValue)) ? displayValue : Number(displayValue).toLocaleString()}
            </div>
            {/* 숫자 뒤 그림자 효과 */}
            <div className="absolute inset-0 font-extrabold text-blue-400 opacity-30 blur-sm transform translate-x-0.5 translate-y-0.5" style={{ fontSize: '2.75rem' }}>
              {isNaN(Number(displayValue)) ? displayValue : Number(displayValue).toLocaleString()}
            </div>
          </div>
        </div>
        
        {/* 아이콘과 라벨 - 하단에 위치 */}
        <div className="flex items-center justify-center space-x-2 mt-4">
          <div className="p-2 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg group-hover:scale-110 transition-transform duration-300">
            {React.cloneElement(icon as React.ReactElement, { 
              size: 18,
              className: `${(icon as React.ReactElement).props.className} drop-shadow-sm` 
            })}
          </div>
          <div className="text-sm font-medium text-gray-600 uppercase tracking-wide">
            {label}
          </div>
        </div>
      </div>
      
      {/* 호버 시 미묘한 글로우 */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
    </div>
  );
};

export default StatsCard;
