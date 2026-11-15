import React from 'react';
import { ViewType } from '../../../types';
import { SIDE_SILHOUETTE_PATH } from './sideOutline';

interface BodyOutlineProps {
  view: ViewType;
  className?: string;
}

/**
 * Anatomically proportioned body outline
 * ViewBox: 200 x 440
 * Based on 8-head proportion rule
 */

// Front view body outline
const FrontOutline: React.FC = () => (
  <g className="body-outline" fill="none" strokeWidth="1.5">
    {/* Head */}
    <ellipse cx="100" cy="28" rx="22" ry="28" />

    {/* Neck */}
    <path d="M88,52 L88,70 M112,52 L112,70" />

    {/* Shoulders to torso */}
    <path d="M88,70 C70,72 50,78 35,90 L25,110" />
    <path d="M112,70 C130,72 150,78 165,90 L175,110" />

    {/* Torso sides */}
    <path d="M45,105 C42,130 45,160 55,200 L60,215" />
    <path d="M155,105 C158,130 155,160 145,200 L140,215" />

    {/* Inner torso / waist */}
    <path d="M65,200 C75,205 90,210 100,210 C110,210 125,205 135,200" />

    {/* Arms - left */}
    <path d="M25,110 C20,130 18,160 18,190 L15,265" />
    <path d="M35,108 C32,125 30,155 28,185 L25,260" />

    {/* Arms - right */}
    <path d="M175,110 C180,130 182,160 182,190 L185,265" />
    <path d="M165,108 C168,125 170,155 172,185 L175,260" />

    {/* Hands */}
    <ellipse cx="20" cy="275" rx="8" ry="15" />
    <ellipse cx="180" cy="275" rx="8" ry="15" />

    {/* Hips / pelvis */}
    <path d="M60,215 C55,225 52,235 50,250" />
    <path d="M140,215 C145,225 148,235 150,250" />

    {/* Legs - left outer */}
    <path d="M50,250 C45,290 42,340 45,390 L50,430" />
    {/* Legs - left inner */}
    <path d="M88,215 C90,250 88,300 85,350 L82,420" />

    {/* Legs - right outer */}
    <path d="M150,250 C155,290 158,340 155,390 L150,430" />
    {/* Legs - right inner */}
    <path d="M112,215 C110,250 112,300 115,350 L118,420" />

    {/* Feet */}
    <path d="M45,430 C40,432 35,435 32,438 L72,438 C78,435 82,432 82,428" />
    <path d="M155,430 C160,432 165,435 168,438 L128,438 C122,435 118,432 118,428" />

    {/* Center line (subtle) */}
    <path d="M100,70 L100,210" strokeDasharray="2,4" opacity="0.1" />
  </g>
);

// Back view body outline
const BackOutline: React.FC = () => (
  <g className="body-outline" fill="none" strokeWidth="1.5">
    {/* Head */}
    <ellipse cx="100" cy="28" rx="22" ry="28" />

    {/* Neck */}
    <path d="M88,52 L88,70 M112,52 L112,70" />

    {/* Shoulders */}
    <path d="M88,70 C70,72 50,78 35,90 L25,110" />
    <path d="M112,70 C130,72 150,78 165,90 L175,110" />

    {/* Back / torso sides */}
    <path d="M45,105 C42,130 45,160 55,190 L60,210" />
    <path d="M155,105 C158,130 155,160 145,190 L140,210" />

    {/* Spine */}
    <path d="M100,70 L100,200" strokeDasharray="3,3" opacity="0.15" />

    {/* Arms - left */}
    <path d="M25,110 C20,130 18,160 18,190 L15,265" />
    <path d="M35,108 C32,125 30,155 28,185 L25,260" />

    {/* Arms - right */}
    <path d="M175,110 C180,130 182,160 182,190 L185,265" />
    <path d="M165,108 C168,125 170,155 172,185 L175,260" />

    {/* Hands */}
    <ellipse cx="20" cy="275" rx="8" ry="15" />
    <ellipse cx="180" cy="275" rx="8" ry="15" />

    {/* Glutes / hip area */}
    <path d="M60,210 C55,225 50,240 48,260" />
    <path d="M140,210 C145,225 150,240 152,260" />
    <path d="M75,205 C85,215 95,220 100,220 C105,220 115,215 125,205" />

    {/* Legs - left outer */}
    <path d="M48,260 C45,300 42,350 45,400 L48,435" />
    {/* Legs - left inner */}
    <path d="M90,215 C92,260 90,310 88,360 L85,425" />

    {/* Legs - right outer */}
    <path d="M152,260 C155,300 158,350 155,400 L152,435" />
    {/* Legs - right inner */}
    <path d="M110,215 C108,260 110,310 112,360 L115,425" />

    {/* Feet */}
    <path d="M45,435 C40,437 35,440 35,440 L75,440 C80,438 85,435 85,432" />
    <path d="M155,435 C160,437 165,440 165,440 L125,440 C120,438 115,435 115,432" />
  </g>
);

// Side view body outline (faces right): one closed silhouette plus interior detail
const SideOutline: React.FC = () => (
  <g className="body-outline" fill="none" strokeWidth="1.5">
    <path d={SIDE_SILHOUETTE_PATH} />

    {/* Near arm: shoulder cap, upper arm, forearm and hand, hanging at the side */}
    <path d="M92,76 C94,74 97.4,73.2 100,73 C102.6,72.8 105.5,73.8 107.5,75 C109.5,76.2 110.9,77.7 112,80 C113.1,82.3 113.7,85.7 114,89 C114.3,92.3 113.9,95.7 113.8,100 C113.7,104.3 113.6,109.2 113.6,115 C113.6,120.8 113.9,128.3 113.8,135 C113.7,141.7 113.5,148.3 113.2,155 C112.9,161.7 112.4,168.8 111.8,175 C111.2,181.2 109.9,187.3 109.8,192 C109.7,196.7 110.8,199.3 111.2,203 C111.6,206.7 112,209.2 112,214 C112,218.8 111.6,226 111,232 C110.4,238 109.3,245 108.5,250 C107.8,255 106.6,258.8 106.5,262 C106.4,265.2 107.7,266.5 108,269 C108.3,271.5 108.8,274.5 108.5,277 C108.2,279.5 107.3,282.3 106,284 C104.8,285.7 102.7,287 101,287 C99.3,287 97.2,285.7 96,284 C94.8,282.3 93.9,279.5 93.6,277 C93.3,274.5 93.9,271.5 94,269 C94.1,266.5 94.5,265.2 94.2,262 C94,258.8 93.1,255 92.5,250 C91.9,245 91,238 90.5,232 C90,226 89.6,218.8 89.5,214 C89.4,209.2 89.7,206.3 89.8,203 C89.9,199.7 90.6,197.8 90.3,194 C90,190.2 88.8,185.7 88.2,180 C87.6,174.3 87.1,166.7 86.8,160 C86.5,153.3 86.4,146.7 86.3,140 C86.2,133.3 86.2,126.7 86.2,120 C86.2,113.3 86.2,105.8 86.5,100 C86.8,94.2 87.3,89 88.2,85 C89.1,81 90,78 92,76 Z" opacity="0.6" />

    {/* Jaw line */}
    <path d="M95,47 C99,52 106,55 118,57" opacity="0.5" />

    {/* Ear hint */}
    <path d="M93,27 C98,26 100,32 98,38 C97,41 94,42 92,40" opacity="0.5" />
  </g>
);

export const BodyOutline: React.FC<BodyOutlineProps> = ({ view, className }) => {
  return (
    <g className={className}>
      {view === 'front' && <FrontOutline />}
      {view === 'back' && <BackOutline />}
      {view === 'side' && <SideOutline />}
    </g>
  );
};

export default BodyOutline;
