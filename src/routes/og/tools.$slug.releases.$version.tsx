import { createFileRoute } from '@tanstack/react-router'
import { ImageResponse } from '@vercel/og'
import { formatDistanceToNow } from 'date-fns'
import { CommandPrompt } from '@/components/og/command-prompt'
import { LogoBox } from '@/components/og/logo-box'
import { OGLayout } from '@/components/og/og-layout'
import type { ChangeType } from '@/generated/prisma/client'
import { loadOGFonts } from '@/lib/og-fonts'
import { createOGErrorResponse, createOGImageResponse } from '@/lib/og-response'
import { getToolLogoSVG } from '@/lib/og-utils'
import { formatVersionForDisplay } from '@/lib/version-formatter'
import { getReleaseWithChanges } from '@/server/tools'

export const Route = createFileRoute('/og/tools/$slug/releases/$version')({
	server: {
		handlers: {
			GET: async ({ params }) => {
				try {
					const release = await getReleaseWithChanges({
						data: { toolSlug: params.slug, version: params.version },
					})
					const fonts = await loadOGFonts()
					const logoSVG = getToolLogoSVG(params.slug)

					const formattedVersion =
						release.formattedVersion ||
						formatVersionForDisplay(params.version, params.slug)
					const timeAgo = formatDistanceToNow(
						new Date(release.releaseDate ?? new Date()),
						{
							addSuffix: true,
						},
					)

					const changesByType: Record<ChangeType, number> = {
						FEATURE: 0,
						BUGFIX: 0,
						IMPROVEMENT: 0,
						BREAKING: 0,
						SECURITY: 0,
						DEPRECATION: 0,
						PERFORMANCE: 0,
						DOCUMENTATION: 0,
						OTHER: 0,
					}

					let hasBreaking = false
					let hasSecurity = false
					let hasDeprecation = false

					for (const change of release.changes) {
						changesByType[change.type]++
						if (change.isBreaking) hasBreaking = true
						if (change.isSecurity) hasSecurity = true
						if (change.isDeprecation) hasDeprecation = true
					}

					const topChangeTypes = Object.entries(changesByType)
						.filter(([_, count]) => count > 0)
						.sort(([_, a], [__, b]) => b - a)
						.slice(0, 3)

					const totalChanges = release.changes.length

					const image = new ImageResponse(
						<OGLayout
							title={`~/tools/${params.slug}/releases/${formattedVersion}`}
							breadcrumbs={[
								'changelogs.directory',
								params.slug,
								formattedVersion,
							]}
							indicator="Release Details"
						>
							{/* Command Input */}
							<CommandPrompt
								command={`view release --tool ${params.slug} --version ${formattedVersion}`}
							/>

							{/* Main Content Area */}
							<div
								style={{
									display: 'flex',
									flex: 1,
									alignItems: 'center',
									justifyContent: 'center',
									gap: '64px',
								}}
							>
								{/* Left: Logo */}
								<LogoBox>{logoSVG && logoSVG}</LogoBox>

								{/* Right: Info */}
								<div
									style={{
										display: 'flex',
										flexDirection: 'column',
										justifyContent: 'center',
										flex: 1,
										maxWidth: '700px',
									}}
								>
									{/* Header: Tool Name + Version */}
									<div
										style={{
											display: 'flex',
											flexDirection: 'column',
											marginBottom: '24px',
										}}
									>
										<div
											style={{
												display: 'flex',
												fontSize: '32px',
												color: '#888888',
												marginBottom: '8px',
											}}
										>
											{release.tool.name}
										</div>
										<div
											style={{
												display: 'flex',
												fontSize: '64px',
												color: '#FFFFFF',
												fontWeight: 700,
												letterSpacing: '-0.02em',
												textShadow: '0 0 40px rgba(255,255,255,0.2)',
												alignItems: 'center',
												gap: '24px',
											}}
										>
											{formattedVersion}
											<div
												style={{
													display: 'flex',
													fontSize: '20px',
													color: '#666666',
													fontWeight: 400,
													letterSpacing: 'normal',
													textShadow: 'none',
													marginTop: '12px',
												}}
											>
												{'//'} {timeAgo}
											</div>
										</div>
									</div>

									{/* Headline */}
									{release.headline && (
										<div
											style={{
												display: 'flex',
												fontFamily: 'Inter',
												fontSize: '24px',
												fontStyle: 'italic',
												color: '#CCCCCC',
												marginBottom: '32px',
												lineHeight: '1.4',
											}}
										>
											"{release.headline}"
										</div>
									)}

									{/* Stats & Badges */}
									<div
										style={{
											display: 'flex',
											flexDirection: 'column',
											gap: '24px',
										}}
									>
										{/* Badges Row */}
										{(hasBreaking || hasSecurity || hasDeprecation) && (
											<div style={{ display: 'flex', gap: '12px' }}>
												{hasBreaking && (
													<div
														style={{
															display: 'flex',
															alignItems: 'center',
															gap: '8px',
															backgroundColor: 'rgba(220, 38, 38, 0.2)',
															border: '1px solid rgba(220, 38, 38, 0.5)',
															color: '#F87171',
															padding: '6px 12px',
															borderRadius: '4px',
															fontSize: '16px',
															fontWeight: 700,
														}}
													>
														⚠️ BREAKING
													</div>
												)}
												{hasSecurity && (
													<div
														style={{
															display: 'flex',
															alignItems: 'center',
															gap: '8px',
															backgroundColor: 'rgba(220, 38, 38, 0.2)',
															border: '1px solid rgba(220, 38, 38, 0.5)',
															color: '#F87171',
															padding: '6px 12px',
															borderRadius: '4px',
															fontSize: '16px',
															fontWeight: 700,
														}}
													>
														🔒 SECURITY
													</div>
												)}
												{hasDeprecation && (
													<div
														style={{
															display: 'flex',
															alignItems: 'center',
															gap: '8px',
															backgroundColor: 'rgba(245, 158, 11, 0.2)',
															border: '1px solid rgba(245, 158, 11, 0.5)',
															color: '#FBBF24',
															padding: '6px 12px',
															borderRadius: '4px',
															fontSize: '16px',
															fontWeight: 700,
														}}
													>
														📛 DEPRECATION
													</div>
												)}
											</div>
										)}

										{/* Changes Stats */}
										<div
											style={{
												display: 'flex',
												alignItems: 'center',
												gap: '24px',
												color: '#888888',
												fontSize: '20px',
											}}
										>
											<div style={{ display: 'flex', color: '#FFFFFF' }}>
												{totalChanges} total{' '}
												{totalChanges === 1 ? 'change' : 'changes'}
											</div>
											<div
												style={{
													display: 'flex',
													width: '1px',
													height: '20px',
													backgroundColor: '#333333',
												}}
											/>
											<div style={{ display: 'flex', gap: '16px' }}>
												{topChangeTypes.map(([type, count]) => (
													<span key={type}>
														{count}{' '}
														{type.charAt(0) + type.slice(1).toLowerCase()}
														{count !== 1 && type !== 'BUGFIX'
															? 's'
															: type === 'BUGFIX' && count !== 1
																? 'es'
																: ''}
													</span>
												))}
											</div>
										</div>
									</div>

									{/* Call to Action */}
									<div
										style={{
											display: 'flex',
											marginTop: '32px',
											width: 'fit-content',
										}}
									>
										<div
											style={{
												display: 'flex',
												alignItems: 'center',
												gap: '12px',
												padding: '12px 20px',
												background: 'rgba(255, 255, 255, 0.03)',
												border: '1px solid rgba(255, 255, 255, 0.08)',
												borderRadius: '6px',
												fontFamily: 'Fira Code',
												fontSize: '14px',
												color: '#666666',
											}}
										>
											<span style={{ color: '#888888' }}>$</span>
											<span style={{ color: '#999999' }}>click</span>
											<span style={{ color: '#555555' }}>--to-read</span>
											<span style={{ color: '#777777' }}>changelog</span>
											<div
												style={{
													display: 'flex',
													marginLeft: '12px',
													color: '#444444',
													fontSize: '16px',
												}}
											>
												→
											</div>
										</div>
									</div>
								</div>
							</div>
						</OGLayout>,
						{
							width: 1200,
							height: 630,
							fonts,
						},
					)

					return createOGImageResponse(image.body)
				} catch (error) {
					return createOGErrorResponse(error, 'release')
				}
			},
		},
	},
})
