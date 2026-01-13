import { useState, useEffect, useRef, useCallback } from 'react';
import { PixelCard } from '@librechat/client';
import { Constants } from 'librechat-data-provider';
import type { TAttachment, TFile, TAttachmentMetadata } from 'librechat-data-provider';
import Image from '~/components/Chat/Messages/Content/Image';
import ProgressText from '../OpenAIImageGen/ProgressText';
import { scaleImage } from '~/utils';

export default function MCPImageGen({
  initialProgress = 0.1,
  isSubmitting,
  toolName,
  args: _args = '',
  output,
  attachments,
}: {
  initialProgress: number;
  isSubmitting: boolean;
  toolName: string;
  args: string | Record<string, unknown>;
  output?: string | null;
  attachments?: TAttachment[];
}) {
  const [progress, setProgress] = useState(initialProgress);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Parse MCP tool name
  const [funcName, serverName] = toolName.split(Constants.mcp_delimiter);
  const displayName = `${funcName} (${serverName || 'MCP'})`;

  const error =
    typeof output === 'string' && output.toLowerCase().includes('error processing tool');

  const cancelled = (!isSubmitting && initialProgress < 1) || error === true;

  let width: number | undefined;
  let height: number | undefined;
  let prompt = '';

  // Parse args if it's a string
  let parsedArgs;
  try {
    parsedArgs = typeof _args === 'string' ? JSON.parse(_args) : _args;
  } catch (error) {
    console.error('Error parsing args:', error);
    parsedArgs = {};
  }

  try {
    const argsObj = parsedArgs;

    // Extract prompt from various possible field names
    if (argsObj) {
      prompt = argsObj.prompt || argsObj.description || argsObj.text || argsObj.query || '';
    }

    // Try to parse size if provided
    if (argsObj && typeof argsObj.size === 'string') {
      const [w, h] = argsObj.size.split('x').map((v: string) => parseInt(v, 10));
      if (!isNaN(w) && !isNaN(h)) {
        width = w;
        height = h;
      }
    } else if (argsObj && (argsObj.width && argsObj.height)) {
      width = parseInt(String(argsObj.width), 10);
      height = parseInt(String(argsObj.height), 10);
    }
  } catch (e) {
    width = undefined;
    height = undefined;
  }

  // Default to 1024x1024 if width and height are still undefined
  const attachment = attachments?.[0];
  const {
    width: imageWidth,
    height: imageHeight,
    filepath = null,
    filename = '',
  } = (attachment as TFile & TAttachmentMetadata) || {};

  let origWidth = width ?? imageWidth;
  let origHeight = height ?? imageHeight;

  if (origWidth === undefined || origHeight === undefined) {
    origWidth = 1024;
    origHeight = 1024;
  }

  const [dimensions, setDimensions] = useState({ width: 'auto', height: 'auto' });
  const containerRef = useRef<HTMLDivElement>(null);

  const updateDimensions = useCallback(() => {
    if (origWidth && origHeight && containerRef.current) {
      const scaled = scaleImage({
        originalWidth: origWidth,
        originalHeight: origHeight,
        containerRef,
      });
      setDimensions(scaled);
    }
  }, [origWidth, origHeight]);

  useEffect(() => {
    if (isSubmitting) {
      setProgress(initialProgress);

      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      // MCP image generation typically takes 15-60 seconds depending on the tool
      // Using a base duration of 30 seconds with jitter
      const baseDuration = 30000;
      const jitter = Math.floor(baseDuration * 0.3);
      const totalDuration = Math.floor(Math.random() * jitter) + baseDuration;
      const updateInterval = 200;
      const totalSteps = totalDuration / updateInterval;
      let currentStep = 0;

      intervalRef.current = setInterval(() => {
        currentStep++;

        if (currentStep >= totalSteps) {
          clearInterval(intervalRef.current as NodeJS.Timeout);
          setProgress(0.9);
        } else {
          const progressRatio = currentStep / totalSteps;
          let mapRatio: number;
          if (progressRatio < 0.8) {
            mapRatio = Math.pow(progressRatio, 1.1);
          } else {
            const sub = (progressRatio - 0.8) / 0.2;
            mapRatio = 0.8 + (1 - Math.pow(1 - sub, 2)) * 0.2;
          }
          const scaledProgress = 0.1 + mapRatio * 0.8;

          setProgress(scaledProgress);
        }
      }, updateInterval);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isSubmitting, initialProgress]);

  useEffect(() => {
    if (initialProgress >= 1 || cancelled) {
      setProgress(initialProgress);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
  }, [initialProgress, cancelled]);

  useEffect(() => {
    updateDimensions();

    const resizeObserver = new ResizeObserver(() => {
      updateDimensions();
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, [updateDimensions]);

  return (
    <>
      {prompt && (
        <div className="mb-2 text-sm text-text-secondary italic">
          &ldquo;{prompt}&rdquo;
        </div>
      )}
      <div className="relative my-2.5 flex size-5 shrink-0 items-center gap-2.5">
        <ProgressText progress={progress} error={cancelled} toolName={displayName} />
      </div>
      <div className="relative mb-2 flex w-full justify-start">
        <div ref={containerRef} className="w-full max-w-lg">
          {dimensions.width !== 'auto' && progress < 1 && (
            <PixelCard
              variant="default"
              progress={progress}
              randomness={0.6}
              width={dimensions.width}
              height={dimensions.height}
            />
          )}
          <Image
            altText={filename || prompt || 'MCP generated image'}
            imagePath={filepath ?? ''}
            width={Number(dimensions.width?.split('px')[0])}
            height={Number(dimensions.height?.split('px')[0])}
            placeholderDimensions={{ width: dimensions.width, height: dimensions.height }}
            args={parsedArgs}
          />
        </div>
      </div>
    </>
  );
}
