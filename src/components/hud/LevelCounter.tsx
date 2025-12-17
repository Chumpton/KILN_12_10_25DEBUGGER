
import React from 'react';

interface LevelCounterProps {
    level: number;
}

const PixelText = ({ text, size, gradient, strokeWidth = 3 }: { text: string | number, size: string, gradient: string, strokeWidth?: number }) => {
    return (
        <div className="relative inline-block select-none" style={{ fontFamily: '"Jersey 25", sans-serif' }}>
            {/* Outline Layer */}
            <div
                className="absolute left-0 top-0 z-0 select-none"
                style={{
                    fontSize: size,
                    fontWeight: 400,
                    lineHeight: 1,
                    color: 'black',
                    WebkitTextStroke: `${strokeWidth}px black`,
                    userSelect: 'none'
                }}
            >
                {text}
            </div>

            {/* Grading Fill Layer */}
            <div
                className="relative z-10 select-none leading-none"
                style={{
                    fontSize: size,
                    fontWeight: 400,
                    lineHeight: 1,
                    backgroundImage: gradient,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    color: 'transparent', // Fallback
                    userSelect: 'none'
                }}
            >
                {text}
            </div>
        </div>
    );
};

export const LevelCounter: React.FC<LevelCounterProps> = ({ level }) => {
    return (
        <div className="flex items-end gap-2 pointer-events-auto z-40">
            {/* 'LVL' Label */}
            <div className="mb-1">
                <PixelText
                    text="LVL"
                    size="24px"
                    gradient="linear-gradient(to bottom, #ffffff 40%, #9ca3af 100%)"
                    strokeWidth={4}
                />
            </div>

            {/* Level Number */}
            <div>
                <PixelText
                    text={level}
                    size="48px"
                    gradient="linear-gradient(to bottom, #fde047 0%, #ca8a04 100%)"
                    strokeWidth={5}
                />
            </div>
        </div>
    );
};
