import React from 'react';

/**
 * CardInfo - presentational component for profile card info block
 *
 * Props:
 * - name: string
 * - age: number | null
 * - gender: 'male' | 'female' | 'prefer_not_to_say' | '' | undefined
 * - distance: number | string | null | undefined
 * - bio: string | undefined
 * - classNames: {
 *     nameAge?: string,
 *     category?: string,
 *     distance?: string,
 *     bioPreview?: string,
 *   }
 */
export default function CardInfo({ name, age, gender, distance, bio, classNames = {} }) {
	const renderGender = () => {
		switch (gender) {
			case 'male':
				return 'Male';
			case 'female':
				return 'Female';
			case 'prefer_not_to_say':
				return 'Prefer not to say';
			default:
				return 'Not specified';
		}
	};

	const renderDistance = () => {
		if (distance === 0 || distance === '0') return 'Nearby';
		if (distance !== null && distance !== undefined) return `${distance} kilometers away`;
		return null;
	};

	return (
		<>
			<div className={classNames.nameAge}>
				<h3>
					{name}{age ? `, ${age}` : ''}
				</h3>
				<div className={classNames.category}>
					<i className="fa fa-venus-mars"></i>
					<span>{renderGender()}</span>
					{renderDistance() && (
						<>
							<i className="fa fa-map-marker-alt"></i>
							<span>{renderDistance()}</span>
						</>
					)}
				</div>
			</div>
			{bio && (
				<div className={classNames.bioPreview}>
					{bio}
				</div>
			)}
		</>
	);
}
