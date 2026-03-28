import { cn } from '../../lib/utils';

type BGMaskType =
    | 'fade-center'
    | 'fade-edges'
    | 'fade-top'
    | 'fade-bottom'
    | 'fade-left'
    | 'fade-right'
    | 'fade-x'
    | 'fade-y'
    | 'none';

type BGPatternProps = React.ComponentProps<'div'> & {
    mask?: BGMaskType;
    size?: number;
    fill?: string;
};

const maskClasses: Record<BGMaskType, string> = {
    'fade-edges': '[mask-image:radial-gradient(ellipse_at_center,var(--background),transparent)]',
    'fade-center': '[mask-image:radial-gradient(ellipse_at_center,transparent,var(--background))]',
    'fade-top': '[mask-image:linear-gradient(to_bottom,transparent,var(--background))]',
    'fade-bottom': '[mask-image:linear-gradient(to_bottom,var(--background),transparent)]',
    'fade-left': '[mask-image:linear-gradient(to_right,transparent,var(--background))]',
    'fade-right': '[mask-image:linear-gradient(to_right,var(--background),transparent)]',
    'fade-x': '[mask-image:linear-gradient(to_right,transparent,var(--background),transparent)]',
    'fade-y': '[mask-image:linear-gradient(to_bottom,transparent,var(--background),transparent)]',
    none: '',
};

const BGPattern = ({
    mask = 'fade-edges',
    size = 24,
    fill = '#252525',
    className,
    style,
    ...props
}: BGPatternProps) => {
    const bgSize = `${size}px ${size}px`;
    const backgroundImage = `linear-gradient(to right, ${fill} 1px, transparent 1px), linear-gradient(to bottom, ${fill} 1px, transparent 1px)`;

    return (
        <div
            className={cn('absolute inset-0 z-0 size-full pointer-events-none', maskClasses[mask], className)}
            style={{
                backgroundImage,
                backgroundSize: bgSize,
                ...style,
            }}
            {...props}
        />
    );
};

BGPattern.displayName = 'BGPattern';
export { BGPattern };
