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
    <path d="M93,75 C95,73.5 97.7,73 100,73 C102.3,73 105,73.7 107,75 C109,76.3 110.8,78.2 112,81 C113.2,83.8 113.9,87.8 114,92 C114.1,96.2 112.8,100.5 112.5,106 C112.3,111.5 112.4,117.7 112.5,125 C112.6,132.3 113.1,141.7 113,150 C112.9,158.3 112.6,167.7 112,175 C111.4,182.3 109.6,187.8 109.5,194 C109.4,200.2 111.3,205.2 111.5,212 C111.7,218.8 111.3,226.7 110.5,235 C109.8,243.3 107.3,255.3 107,262 C106.7,268.7 108.7,270.5 108.5,275 C108.3,279.5 107.3,285.7 106,289 C104.8,292.3 102.6,295 101,295 C99.4,295 97.7,292.3 96.5,289 C95.3,285.7 94.5,279.5 94,275 C93.5,270.5 93.8,267.8 93.5,262 C93.2,256.2 92.4,247.8 92,240 C91.6,232.2 91.4,222.2 91,215 C90.6,207.8 90.2,203.7 89.5,197 C88.8,190.3 87.5,183.7 87,175 C86.5,166.3 86.7,155 86.5,145 C86.3,135 86.1,123.3 86,115 C85.9,106.7 85.7,100.5 86,95 C86.3,89.5 86.8,85.3 88,82 C89.2,78.7 91,76.5 93,75 Z" opacity="0.6" />

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
