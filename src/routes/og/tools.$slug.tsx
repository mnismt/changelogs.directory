import { createFileRoute } from '@tanstack/react-router'
import { ImageResponse } from '@vercel/og'
import { formatDistanceToNow } from 'date-fns'
import { OGBackground } from '@/components/og/og-background'
import { TerminalChrome } from '@/components/og/terminal-chrome'
import { loadOGFonts } from '@/lib/og-fonts'
import { getToolLogoSVG } from '@/lib/og-utils'
import { getToolMetadata } from '@/server/tools'

export const Route = createFileRoute('/og/tools/$slug')({
	server: {
		handlers: {
			GET: async ({ params }) => {
				try {
					const tool = await getToolMetadata({ data: { slug: params.slug } })
					const fonts = await loadOGFonts()
					const logoSVG = getToolLogoSVG(params.slug)

					const timeAgo = tool.latestReleaseDate
						? formatDistanceToNow(new Date(tool.latestReleaseDate), {
								addSuffix: true,
							})
						: null

					const image = new ImageResponse(
						<div
							style={{
								height: '100%',
								width: '100%',
								display: 'flex',
								flexDirection: 'column',
								backgroundColor: '#0A0A0A',
								position: 'relative',
								fontFamily: 'Fira Code',
							}}
						>
							<OGBackground />

							{/* Radial Glow Effect */}
							<div
								style={{
									display: 'flex',
									position: 'absolute',
									top: '50%',
									left: '50%',
									transform: 'translate(-50%, -50%)',
									width: '800px',
									height: '800px',
									background:
										'radial-gradient(circle, rgba(255,255,255,0.03) 0%, transparent 70%)',
								}}
							/>

							<TerminalChrome title={`~/tools/${params.slug}`} />

							{/* Command Line Interface */}
							<div
								style={{
									display: 'flex',
									flexDirection: 'column',
									padding: '32px 48px',
									flex: 1,
									position: 'relative',
								}}
							>
								{/* Command Input */}
								<div
									style={{
										display: 'flex',
										alignItems: 'center',
										gap: '12px',
										fontSize: '24px',
										color: '#AAAAAA',
										marginBottom: '48px',
									}}
								>
									<span style={{ color: '#CCCCCC' }}>&gt;</span>
									<span style={{ color: '#999999' }}>~</span>
									<span>
										info {tool.name.toLowerCase().replace(/\s+/g, '-')}
									</span>
									<div
										style={{
											display: 'flex',
											width: '12px',
											height: '24px',
											backgroundColor: '#AAAAAA',
											opacity: 0.8,
										}}
									/>
								</div>

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
									<div
										style={{
											display: 'flex',
											alignItems: 'center',
											justifyContent: 'center',
											width: '200px',
											height: '200px',
											background:
												'linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 100%)',
											border: '1px solid rgba(255,255,255,0.1)',
											borderRadius: '24px',
											padding: '40px',
										}}
									>
										{logoSVG && logoSVG}
									</div>

									{/* Right: Info */}
									<div
										style={{
											display: 'flex',
											flexDirection: 'column',
											justifyContent: 'center',
										}}
									>
										<div
											style={{
												display: 'flex',
												fontSize: '64px',
												color: '#FFFFFF',
												fontWeight: 700,
												marginBottom: '16px',
												letterSpacing: '-0.02em',
												textShadow: '0 0 40px rgba(255,255,255,0.2)',
											}}
										>
											{tool.name}
										</div>

										{tool.latestVersion && (
											<div
												style={{
													display: 'flex',
													alignItems: 'center',
													gap: '16px',
													marginBottom: '24px',
												}}
											>
												<div
													style={{
														display: 'flex',
														fontSize: '32px',
														color: '#FFFFFF',
														background: 'rgba(255, 255, 255, 0.08)',
														padding: '4px 16px',
														borderRadius: '4px',
														border: '1px solid rgba(255, 255, 255, 0.15)',
													}}
												>
													v{tool.latestVersion}
												</div>
												{timeAgo && (
													<div
														style={{
															display: 'flex',
															fontSize: '24px',
															color: '#666666',
														}}
													>
														{'//'} {timeAgo}
													</div>
												)}
											</div>
										)}

										<div
											style={{
												display: 'flex',
												gap: '32px',
												color: '#888888',
												fontSize: '20px',
												marginBottom: '32px',
											}}
										>
											<div style={{ display: 'flex', gap: '8px' }}>
												<span style={{ color: '#444444' }}>VENDOR:</span>
												<span style={{ color: '#CCCCCC' }}>
													{tool.vendor || 'Unknown'}
												</span>
											</div>
											<div style={{ display: 'flex', gap: '8px' }}>
												<span style={{ color: '#444444' }}>RELEASES:</span>
												<span style={{ color: '#CCCCCC' }}>
													{tool._count.releases}
												</span>
											</div>
										</div>

										{/* Call to Action - Dev Style */}
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
													marginLeft: 'auto',
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

							{/* Status Bar with Watermark */}
							<div
								style={{
									height: '32px',
									backgroundColor: '#1A1A1A',
									borderTop: '1px solid #333333',
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'space-between',
									padding: '0 16px',
									fontSize: '13px',
									color: '#666666',
									fontWeight: 500,
								}}
							>
								<div style={{ display: 'flex', gap: '20px' }}>
									<span style={{ color: '#888888' }}>changelogs.directory</span>
									<span style={{ color: '#444444' }}>/</span>
									<span style={{ color: '#888888' }}>
										v{tool.latestVersion}
									</span>
								</div>
								<div
									style={{
										display: 'flex',
										gap: '8px',
										alignItems: 'center',
										color: '#555555',
									}}
								>
									<span>●</span>
									<span style={{ fontSize: '12px', fontFamily: 'Inter' }}>
										Live Release Feed
									</span>
								</div>
							</div>
						</div>,
						{
							width: 1200,
							height: 630,
							fonts,
						},
					)

					return new Response(image.body, {
						headers: {
							'Content-Type': 'image/png',
							'Cache-Control':
								'public, max-age=3600, s-maxage=86400, stale-while-revalidate=31536000',
						},
					})
				} catch (error) {
					console.error('Error generating tool detail OG image:', error)
					return new Response('Failed to generate OG image', { status: 500 })
				}
			},
		},
	},
})
