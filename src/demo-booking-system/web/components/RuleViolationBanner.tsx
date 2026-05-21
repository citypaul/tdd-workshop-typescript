import type { RuleId } from '../../domain/types';

export type RuleViolationBannerProps = {
  readonly error: string;
  readonly rule: RuleId;
};

export const RuleViolationBanner = ({ error, rule }: RuleViolationBannerProps) => (
  <div role="alert" data-rule={rule} className="rule-violation-banner">
    <div>
      <p className="rule-violation-banner__label">Rule violation</p>
      <p className="rule-violation-banner__message">{error}</p>
    </div>
  </div>
);
