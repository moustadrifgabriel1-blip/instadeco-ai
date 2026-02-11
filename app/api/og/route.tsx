import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'edge';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const style = searchParams.get('style') || 'Moderne';
  const room = searchParams.get('room') || 'Salon';
  const img = searchParams.get('img');

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          position: 'relative',
          backgroundColor: '#1d1d1f',
        }}
      >
        {/* Background image */}
        {img && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={img}
            alt=""
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              opacity: 0.6,
            }}
          />
        )}

        {/* Gradient overlay */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'linear-gradient(135deg, rgba(0,0,0,0.7) 0%, rgba(0,0,0,0.3) 50%, rgba(224,123,84,0.4) 100%)',
            display: 'flex',
          }}
        />

        {/* Content */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            padding: '60px',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          {/* Badges */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <div
              style={{
                background: 'rgba(224, 123, 84, 0.9)',
                color: 'white',
                padding: '8px 20px',
                borderRadius: '50px',
                fontSize: '20px',
                fontWeight: 600,
              }}
            >
              🎨 {style}
            </div>
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(10px)',
                color: 'white',
                padding: '8px 20px',
                borderRadius: '50px',
                fontSize: '20px',
                fontWeight: 600,
                border: '1px solid rgba(255,255,255,0.3)',
              }}
            >
              🏠 {room}
            </div>
          </div>

          {/* Title */}
          <div
            style={{
              color: 'white',
              fontSize: '52px',
              fontWeight: 800,
              lineHeight: 1.1,
              letterSpacing: '-0.02em',
              textShadow: '0 2px 10px rgba(0,0,0,0.5)',
            }}
          >
            {room} style {style}
          </div>

          {/* Subtitle */}
          <div
            style={{
              color: 'rgba(255,255,255,0.8)',
              fontSize: '24px',
              fontWeight: 400,
              maxWidth: '600px',
            }}
          >
            Transformation réalisée par IA en 30 secondes
          </div>

          {/* Branding bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: '16px',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                color: 'white',
                fontSize: '26px',
                fontWeight: 700,
              }}
            >
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #E07B54, #D4603C)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px',
                }}
              >
                ✨
              </div>
              InstaDeco AI
            </div>
            <div
              style={{
                color: 'rgba(255,255,255,0.6)',
                fontSize: '18px',
              }}
            >
              instadeco.app
            </div>
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    },
  );
}
