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
