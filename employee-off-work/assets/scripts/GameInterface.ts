import { Color, Graphics, Label, LabelOutline, Mask, Node, ScrollView, Sprite, SpriteFrame, SubContextView, UIOpacity, UITransform } from 'cc';
import { DESIGN_WIDTH, formatClock, HUD_SAFE_HEIGHT, tutorialRewardPosition, tutorialTapPosition, tutorialPickupRoute } from './model/GameLayout';
import type { PlayerProgress, Settlement, TutorialGuide } from './model/GameExperience';
import { TUTORIAL_COPY } from './model/GameExperience';
import { sliceFrame } from './FinalArtHud';
import type { Point } from './model/GameModel';
import { OfficeSkin } from './OfficeSkin';
import { GUIDE_PAGES, GuidePage } from './model/GuideCatalog';
import { OFFICE, UI_METRICS, officeContains, officeFolder, officeButton, officeRow, officeIcon, officeUnderline, officeChevron, officeSwitch, officeNotice, officeClose } from './OfficeUi';

export type MenuMode = 'home' | 'paused' | 'resuming' | 'result' | 'tutorial-intro' | 'tutorial-ready' | 'hidden';
export type MenuAction = 'primary' | 'secondary' | 'sound' | 'help' | 'help-close' | 'help-controls' | 'help-bullets' | 'help-resources' | 'friends' | 'friends-close' | 'friends-refresh' | 'friends-share' | 'exit-cancel' | 'exit-confirm';
type HitBox = { x: number; y: number; width: number; height: number };
const INK = OFFICE.ink;
const CREAM = OFFICE.paper;

/** Runtime UI uses the same cream, plum and green palette as the approved artwork. */
export class GameInterface {
  readonly friends: FriendLeaderboardView;
  private friendsEntry: Label;
  private friendsEntryInk: Graphics;
  private secondaryInk: Graphics;
  private friendsButton: HitBox = { x: 0, y: 0, width: 194, height: 56 };
  private helpButton: HitBox = { x: 0, y: 0, width: 532, height: 90 };
  private closeButton: HitBox = { x: 0, y: 0, width: 54, height: 54 };
  private settingsHelp: Label;
  private settingsClose: Label;
  private settingsState: Label;
  private settingsPaintKey = '';
  readonly helpRoot: Node;
  private helpScale = 1;
  private readonly helpBackBox: HitBox = { x: 251, y: 407, width: 58, height: 58 };
  private skin = new OfficeSkin();
  private panel: Sprite;
  private mainButton: Sprite;
  private settingsIcons: Sprite[] = [];
  private tutorialBadge: Sprite;
  private helpPaper: Graphics;
  private helpRows: { title: Label; body: Label; icon: Sprite; paper: Graphics }[] = [];
  private helpTabs: Label[] = [];
  private helpFooter: Label;
  private helpPage: GuidePage = 'controls';
  private helpPanel: Sprite;
  private helpTitle: Label;
  private helpCloseLabel: Label;
  private helpScroll: ScrollView;
  private helpContent: Node;
  private helpViewport: Node;
  private helpHeight = 1080;
  private helpViewportHeight = 690;
  private safeCenter = 0;
  private usableHeight = 1600;
  private touchMinimum = 96;
  readonly exitRoot: Node;
  readonly exitCancelBox: HitBox = { x: -140, y: -96, width: 250, height: 88 };
  readonly exitConfirmBox: HitBox = { x: 140, y: -96, width: 250, height: 88 };
  private pressedInk: Graphics;
  private guideFrames = new Map<string, SpriteFrame>();
  readonly root: Node;
  readonly modal: Node;
  readonly guideRoot: Node;
  readonly tutorialCueRoot: Node;
  readonly tapHandRoot: Node;
  private tapAnchor?: Point;
  private tapStartedAt = 0;
  private tutorialCue: Graphics;
  private tapHand: Graphics;
  readonly resumeRoot: Node;
  readonly countdown: Label;
  readonly primary: Label;
  readonly secondary: Label;
  readonly sound: Label;
  readonly guideText: Label;
  readonly guideTitle: Label;
  readonly score: Label;
  readonly rewardRoot: Node;
  readonly rewardLabel: Label;
  private title: Label;
  private subtitle: Label;
  private record: Label;
  private rank: Label;
  private detail: Label;
  private goal: Label;
  private statTitles: Label[] = [];
  private statValues: Label[] = [];
  private hero: Sprite;
  private board: Graphics;
  private guideBoard: Graphics;
  private rewardStars: Graphics;
  private rewardOpacity: UIOpacity;
  private fieldHeight = 1600;
  private mode: MenuMode = 'hidden';
  private resultClock = 0;
  private previousMode: MenuMode = 'hidden';
  readonly menuArt: Node;
  readonly loadingRoot: Node;
  private homeArt: Sprite;
  private homeBottom: Sprite;
  private homeNumberPatch: Sprite;
  private homeNumber: Label;
  private resultArt: Sprite;
  private resultBottom: Sprite;
  private footerPaper: Sprite;
  private homeFooterFrame?: SpriteFrame;
  private compactHomeFooterFrame?: SpriteFrame;
  private resultFooterFrame?: SpriteFrame;
  private stamp: Label;
  private stampInk: Graphics;
  private loadingPoster: Sprite;
  private loadingCanvas: Node;
  private loadingBackdrop: Graphics;
  private loadingFishPatch: Sprite;
  private loadingEmpty: Sprite;
  private loadingFill: Sprite;
  private loadingFishMask: Node;
  private loadingStatus: Label;
  private loadingFish: Sprite;
  readonly retryRoot: Node;
  private loadingReconnect: Graphics;
  private loadingProgress = 0;
  private loading = false;
  private loadingFailed = false;
  private artFrames: SpriteFrame[] = [];
  private homeFrame?: SpriteFrame;
  private compactHomeFrame?: SpriteFrame;
  private resultFrame?: SpriteFrame;
  private resultPatches: Sprite[] = [];
  private resultPatchBoxes = new Map<Sprite, number[]>();
  private cardHeight = 1291;
  private cardScale = 0.5;
  private tutorialArt: Sprite;
  private tutorialIntroFrame?: SpriteFrame;
  private tutorialCompleteFrame?: SpriteFrame;
  private readonly buttons: Record<'primary' | 'secondary' | 'sound', HitBox> = {
    primary: { x: 0, y: -212, width: 480, height: 60 },
    secondary: { x: 0, y: -269, width: 270, height: 40 },
    sound: { x: 247, y: 255, width: 72, height: 38 },
  };

  constructor(parent: Node) {
    this.root = new Node('ExperienceInterface'); parent.addChild(this.root);
    this.modal = new Node('MenuCard'); this.root.addChild(this.modal);
    this.panel = this.skin.sprite(this.modal, 'PaintedOfficePanel', 'uiPanel', 620, 890, true);
    this.panel.node.active = false;
    this.board = this.graphics('MenuPaper', this.modal);
    this.mainButton = this.skin.sprite(this.modal, 'PaintedPrimaryButton', 'greenButton', 532, 94, true);
    this.mainButton.node.active = false;
    for (const key of ['speaker', 'book', 'trophy', 'home']) {
      const icon = this.skin.sprite(this.modal, 'SettingsIcon-' + key, key, 76, 76);
      icon.node.active = false; this.settingsIcons.push(icon);
    }
    this.tutorialBadge = this.skin.sprite(this.modal, 'TutorialBadge', 'book', 220, 220);
    this.tutorialBadge.node.active = false;
    this.menuArt = new Node('ApprovedMenuArtwork'); this.modal.addChild(this.menuArt);
    this.tutorialArt = this.artSprite('TutorialCardArtwork', this.modal);
    this.tutorialArt.node.active = false;
    this.homeArt = this.artSprite('HomeCard', this.menuArt);
    this.homeBottom = this.artSprite('HomeCardCompactBottom', this.menuArt);
    this.footerPaper = this.artSprite('MenuFooterPaper', this.menuArt);
    this.homeNumberPatch = this.artSprite('HomeRecordPatch', this.menuArt);
    this.homeNumber = this.label('LivePersonalBest', this.menuArt, 64, 0, 0, 260, 82);
    this.homeNumber.isBold = true;
    this.resultArt = this.artSprite('ResultCard', this.menuArt);
    this.resultBottom = this.artSprite('ResultCardBottom', this.menuArt);
    this.title = this.label('MenuTitle', this.modal, 30, 0, 249, 430, 44);
    this.subtitle = this.label('MenuSubtitle', this.modal, 19, 0, 210, 510, 32);
    this.rank = this.label('RunRank', this.modal, 24, 0, 166, 480, 40);
    this.score = this.label('RunScore', this.modal, 62, 0, 99, 510, 80);
    this.score.isBold = true;
    this.record = this.label('PersonalRecord', this.modal, 18, 0, 44, 510, 36);
    for (let index = 0; index < 3; index++) {
      this.statTitles.push(this.label(`StatTitle${index}`, this.modal, 15, (index - 1) * 176, -3, 165, 26));
      this.statValues.push(this.label(`StatValue${index}`, this.modal, 25, (index - 1) * 176, -34, 165, 34));
    }
    this.detail = this.label('RunSkills', this.modal, 18, 0, -82, 510, 30);
    this.goal = this.label('NextRunGoal', this.modal, 19, 0, -137, 510, 58); this.goal.enableWrapText = true;
    const hero = new Node('MenuCat'); hero.addComponent(UITransform).setContentSize(170, 170);
    hero.setPosition(0, 35); this.modal.addChild(hero); this.hero = hero.addComponent(Sprite);
    this.hero.sizeMode = Sprite.SizeMode.CUSTOM;
    this.primary = this.label('PrimaryAction', this.modal, 26, 0, -212, 450, 58); this.primary.isBold = true;
    this.secondaryInk = this.graphics('TutorialEntryPaper', this.modal);
    this.secondary = this.label('SecondaryAction', this.modal, 19, 0, -269, 260, 38);
    this.sound = this.label('SoundToggle', this.modal, 14, 247, 255, 72, 38);
    this.tutorialCueRoot = new Node('TutorialPath'); this.root.addChild(this.tutorialCueRoot);
    this.tutorialCue = this.graphics('DashedTargetPath', this.tutorialCueRoot);
    this.tapHandRoot = new Node('DoubleTapHand'); this.root.addChild(this.tapHandRoot);
    this.tapHand = this.graphics('AnimatedFinger', this.tapHandRoot);
    const tapCaption = this.label('DoubleTapCaption', this.tapHandRoot, 25, 8, -144, 210, 38);
    tapCaption.string = '双击屏幕'; tapCaption.isBold = true;
    tapCaption.color = OFFICE.paper;
    const tapOutline = tapCaption.node.addComponent(LabelOutline);
    tapOutline.color = INK.clone(); tapOutline.width = 3;
    this.guideRoot = new Node('StepGuide'); this.root.addChild(this.guideRoot);
    this.guideBoard = this.graphics('GuidePaper', this.guideRoot);
    this.guideTitle = this.label('GuideTitle', this.guideRoot, 28, 0, 43, 575, 40);
    this.guideTitle.isBold = true;
    this.guideText = this.label('GuideText', this.guideRoot, 26, 0, -15, 575, 80);
    this.guideText.lineHeight = 34;
    this.rewardRoot = new Node('TutorialAchievement'); this.root.addChild(this.rewardRoot);
    this.rewardOpacity = this.rewardRoot.addComponent(UIOpacity);
    this.rewardStars = this.graphics('AchievementStars', this.rewardRoot);
    this.rewardLabel = this.label('AchievementText', this.rewardRoot, 32, 0, 0, 390, 54);
    this.rewardLabel.fontFamily = 'Arial'; this.rewardLabel.isBold = true;
    this.rewardLabel.color = new Color(255, 213, 96);
    const outline = this.rewardLabel.node.addComponent(LabelOutline);
    outline.color = INK.clone(); outline.width = 3;
    this.rewardLabel.string = TUTORIAL_COPY.success; this.rewardRoot.active = false;
    this.resumeRoot = new Node('ResumeCountdown'); this.root.addChild(this.resumeRoot);
    this.countdown = this.label('CountdownNumber', this.resumeRoot, 144, 0, 0, 260, 180);
    this.countdown.isBold = true; this.countdown.color = new Color(255, 237, 153);
    const countdownOutline = this.countdown.node.addComponent(LabelOutline);
    countdownOutline.color = INK.clone(); countdownOutline.width = 5;
    this.resumeRoot.active = false;
    this.stampInk = this.graphics('LiveRankStamp', this.menuArt);
    this.stamp = this.label('LiveRankLetter', this.menuArt, 94, 0, 0, 160, 144);
    this.stamp.color = new Color(176, 26, 219); this.stamp.isBold = true;
    this.loadingRoot = new Node('ApprovedLoadingScreen'); this.root.addChild(this.loadingRoot);
    this.loadingBackdrop = this.graphics('LoadingBackdrop', this.loadingRoot);
    this.loadingCanvas = new Node('OriginalLoadingArtwork'); this.loadingRoot.addChild(this.loadingCanvas);
    this.loadingPoster = this.artSprite('LoadingPoster', this.loadingCanvas);
    this.loadingPoster.node.getComponent(UITransform)!.setContentSize(1080, 2400);
    this.loadingFishPatch = this.artSprite('OriginalFishPositionPatch', this.loadingCanvas);
    this.loadingFishPatch.node.getComponent(UITransform)!.setContentSize(174, 132);
    this.loadingFishPatch.node.setPosition(416 + 87 - 540, 1200 - 2000 - 66);
    const track = new Node('OriginalProgressTrack'); track.addComponent(UITransform).setContentSize(827, 82);
    this.loadingCanvas.addChild(track); track.setPosition(129 + 827 / 2 - 540, 1200 - 2026 - 41);
    track.addComponent(Mask).type = Mask.Type.GRAPHICS_STENCIL;
    const clip = track.getComponent(Graphics)!;
    clip.clear();
    clip.fillColor = Color.WHITE; clip.roundRect(-827 / 2, -41, 827, 82, 41); clip.fill();
    this.loadingEmpty = this.artSprite('OriginalEmptyTrack', track);
    this.loadingFill = this.artSprite('OriginalGreenFill', track);
    for (const sprite of [this.loadingEmpty, this.loadingFill]) sprite.node.getComponent(UITransform)!.setContentSize(827, 82);
    this.loadingFishMask = new Node('OriginalLoadingFish'); this.loadingCanvas.addChild(this.loadingFishMask);
    this.loadingFishMask.addComponent(UITransform).setContentSize(168, 130);
    this.loadingFishMask.addComponent(Mask).type = Mask.Type.GRAPHICS_STENCIL;
    const fishClip = this.loadingFishMask.getComponent(Graphics)!;
    fishClip.clear();
    // Clip the fish out of the approved opaque poster so moving it never drags
    // a rectangular piece of the printed bar or paper along with it.
    const fishContour = [[503,2008],[487,2012],[478,2028],[459,2040],[450,2048],[439,2038],
      [430,2038],[423,2046],[423,2058],[430,2070],[425,2080],[423,2092],[428,2102],
      [437,2107],[450,2100],[461,2093],[478,2107],[490,2113],[489,2118],[497,2125],
      [513,2127],[527,2121],[532,2114],[550,2107],[570,2090],[583,2073],[585,2066],
      [580,2055],[565,2039],[543,2025],[532,2014],[519,2007]];
    fishContour.forEach(([x,y], i) => i ? fishClip.lineTo(x - 504, 2069 - y) : fishClip.moveTo(x - 504, 2069 - y));
    fishClip.close(); fishClip.fillColor = Color.WHITE; fishClip.fill();
    this.loadingFish = this.artSprite('OriginalFishTexture', this.loadingFishMask);
    this.loadingFish.node.getComponent(UITransform)!.setContentSize(168, 130);
    this.loadingReconnect = this.graphics('ReconnectNote', this.loadingRoot);
    this.loadingStatus = this.label('LoadingStatus', this.loadingRoot, 20, 16, 0, 550, 40);
    this.retryRoot = new Node('LoadingRetryCard'); this.loadingRoot.addChild(this.retryRoot);
    this.skin.sprite(this.retryRoot, 'RetryPaintedPanel', 'uiPanel', 540, 330, true);
    const retryPaper = this.graphics('RetryActions', this.retryRoot);
    this.label('RetryTitle', this.retryRoot, 34, 0, 42, 420, 50).string = '加载失败';
    const retryButton = this.skin.sprite(this.retryRoot, 'RetryPaintedButton', 'greenButton', 432, 72, true);
    retryButton.node.setPosition(0, -74);
    const retryLabel = this.label('RetryButton', this.retryRoot, 28, 0, -74, 420, 62);
    retryLabel.string = '重新加载'; retryLabel.isBold = true;
    this.retryRoot.active = false;
    this.loadingRoot.active = false;
    this.menuArt.active = false;
    this.friendsEntryInk = this.graphics('FriendsEntryPaper', this.modal);
    this.friendsEntry = this.label('FriendsLeaderboardEntry', this.modal, 21, -180, 390, 194, 56);
    this.friendsEntry.string = '好友积分榜'; this.friendsEntry.isBold = true;
    this.settingsHelp = this.label('SettingsTutorial', this.modal, 28, 0, 0, 360, 70);
    this.settingsHelp.string = '摸鱼指南'; this.settingsHelp.isBold = true;
    this.settingsClose = this.label('SettingsClose', this.modal, 34, 0, 0, 54, 54);
    this.settingsClose.string = '×'; this.settingsClose.isBold = true;
    this.settingsState = this.label('SoundSwitchState', this.modal, 23, 0, 0, 40, 40);
    this.helpRoot = new Node('OfficeHelpCard'); this.root.addChild(this.helpRoot);
    this.helpPanel = this.skin.sprite(this.helpRoot, 'HelpPaintedPanel', 'uiPanel', 620, 1080, true);
    this.helpPaper = this.graphics('HelpContents', this.helpRoot);
    const helpTitle = this.label('HelpTitle', this.helpRoot, 38, 0, 383, 420, 56);
    this.helpTitle = helpTitle;
    helpTitle.string = '摸鱼指南'; helpTitle.isBold = true;
    const close = this.label('HelpClose', this.helpRoot, 40, 251, 407, 58, 58);
    this.helpCloseLabel = close; close.node.active = false;
    close.string = '×'; close.isBold = true;
    for (const [i, name] of ['操作', '工作弹幕', '资源道具'].entries()) {
      const tab = this.label('HelpTab' + i, this.helpRoot, 25, (i - 1) * 178, 310, 166, 64);
      tab.string = name; tab.isBold = true; this.helpTabs.push(tab);
    }
    this.helpViewport = new Node('GuideScrollViewport'); this.helpRoot.addChild(this.helpViewport);
    this.helpViewport.addComponent(UITransform).setContentSize(548, 690);
    this.helpViewport.addComponent(Mask).type = Mask.Type.GRAPHICS_RECT;
    this.helpContent = new Node('GuideScrollContent'); this.helpViewport.addChild(this.helpContent);
    this.helpContent.addComponent(UITransform).setAnchorPoint(0.5, 1);
    this.helpScroll = this.helpViewport.addComponent(ScrollView);
    this.helpScroll.content = this.helpContent; this.helpScroll.horizontal = false;
    this.helpScroll.vertical = true; this.helpScroll.inertia = true;
    for (let i = 0; i < 4; i++) {
      const paper = this.graphics('GuideRowPaper' + i, this.helpContent);
      const icon = this.artSprite('HelpIcon' + i, this.helpContent);
      const title = this.label('HelpTip' + i, this.helpContent, 30, 45, 0, 352, 44);
      title.isBold = true; title.horizontalAlign = Label.HorizontalAlign.LEFT;
      const body = this.label('HelpBody' + i, this.helpContent, UI_METRICS.body, 45, 0, 352, 140);
      body.enableWrapText = true; body.lineHeight = 39; body.horizontalAlign = Label.HorizontalAlign.LEFT;
      body.color = OFFICE.muted.clone(); this.helpRows.push({ title, body, icon, paper });
    }
    this.helpFooter = this.label('HelpFooter', this.helpRoot, 24, 0, -480, 540, 44);
    this.helpFooter.color = OFFICE.muted.clone(); this.selectHelp('controls');
    this.helpRoot.active = false;
    this.friends = new FriendLeaderboardView(this.root);
    this.exitRoot = new Node('ExitRunConfirmation'); this.root.addChild(this.exitRoot);
    const shade = this.graphics('ExitShade', this.exitRoot);
    shade.fillColor = new Color(31, 21, 40, 170); shade.rect(-360, -2500, 720, 5000); shade.fill();
    const dialog = new Node('ExitDialog'); this.exitRoot.addChild(dialog);
    const paper = this.graphics('ExitPaper', dialog); officeNotice(paper, 620, 370);
    this.label('ExitTitle', dialog, 38, 0, 108, 540, 56).string = '返回首页？';
    const explanation = this.label('ExitExplanation', dialog, 28, 0, 27, 540, 70);
    explanation.string = '将结束本局，并保存本局成绩。'; explanation.enableWrapText = true; explanation.lineHeight = 38;
    officeButton(paper, this.exitCancelBox); officeButton(paper, this.exitConfirmBox, 'cream');
    this.label('ExitKeepPlaying', dialog, 30, -140, -96, 230, 64).string = '继续摸鱼';
    this.label('ExitReturnHome', dialog, 30, 140, -96, 230, 64).string = '返回首页';
    this.exitRoot.active = false;
    this.pressedInk = this.graphics('ButtonPressFeedback', this.root);
  }

  private artSprite(name: string, parent: Node) {
    const node = new Node(name); node.addComponent(UITransform); parent.addChild(node);
    const sprite = node.addComponent(Sprite); sprite.sizeMode = Sprite.SizeMode.CUSTOM; return sprite;
  }
  private slice(frame: SpriteFrame, x: number, y: number, width: number, height: number) {
    const cropped = sliceFrame(frame, x, y, width, height); this.artFrames.push(cropped); return cropped;
  }
  private cardCenterX = 609;
  private place(sprite: Sprite, x: number, y: number, width: number, height: number) {
    sprite.node.setPosition(x + width / 2 - this.cardCenterX, this.cardHeight / 2 - y - height / 2);
    sprite.node.getComponent(UITransform)!.setContentSize(width, height);
  }
  private patch(frame: SpriteFrame, name: string, box: number[], source: number[]) {
    const sprite = this.artSprite(name, this.menuArt);
    sprite.spriteFrame = this.slice(frame, source[0], source[1], source[2], source[3]);
    this.place(sprite, box[0], box[1], box[2], box[3]);
    this.resultPatches.push(sprite);
    this.resultPatchBoxes.set(sprite, box);
  }
  setArt(key: string, frame: SpriteFrame) {
    this.skin.setArt(key, frame); this.friends.setArt(key, frame);
    this.guideFrames.set(key, frame);
    if (this.helpRoot.active) this.selectHelp(this.helpPage);
    if (key === 'tutorialIntroUI') {
      this.tutorialIntroFrame = frame;
    } else if (key === 'tutorialCompleteUI') {
      this.tutorialCompleteFrame = frame;
    } else if (key === 'homeUI') {
      this.homeFrame = this.slice(frame, 0, 0, 1218, 1200);
      this.compactHomeFrame = this.slice(frame, 0, 0, 1218, 1060);
      this.homeBottom.spriteFrame = this.slice(frame, 0, 1200, 1218, 91);
      // Extend the exact final scanlines so the side borders meet without a notch.
      this.homeFooterFrame = this.slice(frame, 0, 1198, 1218, 2);
      this.compactHomeFooterFrame = this.slice(frame, 0, 1058, 1218, 2);
      this.homeNumberPatch.spriteFrame = this.slice(frame, 939, 1107, 12, 77);
    } else if (key === 'resultUI') {
      this.resultFrame = this.slice(frame, 0, 0, 1218, 1200); this.resultArt.spriteFrame = this.resultFrame;
      this.resultBottom.spriteFrame = this.slice(frame, 0, 1200, 1218, 91);
      this.resultFooterFrame = this.slice(frame, 0, 1198, 1218, 2);
      this.patch(frame, 'RankPatch', [380, 474, 328, 62], [710, 474, 12, 62]);
      this.patch(frame, 'StampPatch', [777, 418, 240, 162], [748, 418, 12, 162]);
      this.patch(frame, 'ScorePatch', [330, 550, 455, 143], [790, 550, 16, 143]);
      for (let i = 0; i < 3; i++) this.patch(frame, `StatPatch${i}`,
        [177 + i * 282, 795, 207, 62], [348 + i * 282, 795, 12, 62]);
      this.patch(frame, 'SkillsPatch', [351, 887, 390, 47], [210, 887, 12, 47]);
      this.patch(frame, 'GoalPatch', [301, 962, 590, 60], [903, 962, 12, 60]);
      // All live labels must remain above the artwork and its printed-value patches.
      this.stampInk.node.setSiblingIndex(this.menuArt.children.length - 1);
      this.stamp.node.setSiblingIndex(this.menuArt.children.length - 1);
    } else if (key === 'loadingUI') {
      this.loadingPoster.spriteFrame = frame;
      this.loadingFishPatch.spriteFrame = this.slice(frame, 745, 2000, 8, 132);
      this.loadingEmpty.spriteFrame = this.slice(frame, 800, 2026, 8, 82);
      this.loadingFill.spriteFrame = this.slice(frame, 250, 2026, 8, 82);
      // Creator's filled-sprite assembler needs a texture before updating UVs.
      this.loadingFill.type = Sprite.Type.FILLED; this.loadingFill.fillType = Sprite.FillType.HORIZONTAL;
      this.loadingFill.fillStart = 0;
      this.loadingFish.spriteFrame = this.slice(frame, 420, 2004, 168, 130);
    }
  }
  destroy() { this.skin.destroy(); this.friends.destroy(); for (const frame of this.artFrames) frame.destroy(); }

  private graphics(name: string, parent: Node) {
    const node = new Node(name); node.addComponent(UITransform).setContentSize(DESIGN_WIDTH, 1600);
    parent.addChild(node); return node.addComponent(Graphics);
  }
  private label(name: string, parent: Node, size: number, x: number, y: number, width: number, height: number) {
    const node = new Node(name); node.setPosition(x, y); node.addComponent(UITransform).setContentSize(width, height);
    parent.addChild(node); const label = node.addComponent(Label);
    label.fontSize = size; label.lineHeight = size + 5; label.color = INK.clone();
    label.horizontalAlign = Label.HorizontalAlign.CENTER; label.verticalAlign = Label.VerticalAlign.CENTER;
    label.enableWrapText = false; label.overflow = Label.Overflow.SHRINK; return label;
  }
  setHero(frame: SpriteFrame | null) { this.hero.spriteFrame = frame; }
  resize(height: number, viewport = { cssWidth: 360, safeTop: 0, safeBottom: 0 }) {
    this.tapAnchor = undefined;
    this.fieldHeight = height;
    this.usableHeight = Math.max(640, height - viewport.safeTop - viewport.safeBottom);
    this.safeCenter = (viewport.safeBottom - viewport.safeTop) / 2;
    this.touchMinimum = UI_METRICS.touchPixels * DESIGN_WIDTH / Math.max(1, viewport.cssWidth);
    this.modal.setPosition(0, this.safeCenter);
    this.friends.resize(height, this.usableHeight, this.safeCenter, this.touchMinimum);
    this.resumeRoot.setPosition(0, this.safeCenter);
    this.helpScale = Math.min(1, (DESIGN_WIDTH - 64) / 620);
    this.helpRoot.setScale(this.helpScale, this.helpScale);
    this.helpRoot.setPosition(0, this.safeCenter);
    this.exitRoot.setPosition(0, this.safeCenter);
    const exitScale = Math.min(1, (DESIGN_WIDTH - 64) / 620);
    this.exitRoot.getChildByName('ExitDialog')!.setScale(exitScale, exitScale);
    this.selectHelp(this.helpPage);
    this.rewardRoot.setPosition(0, 60);
    this.guideRoot.setPosition(0, -height / 2 + viewport.safeBottom + 122);
    this.tutorialCue.getComponent(UITransform)!.setContentSize(DESIGN_WIDTH, height);
  }

  showHelp() { this.helpRoot.active = true; this.selectHelp('controls'); }
  selectHelp(page: GuidePage) {
    this.helpPage = page; const data = GUIDE_PAGES[page], g = this.helpPaper; g.clear();
    const rowHeight = 152, pitch = 168, contentHeight = data.rows.length * pitch - 16;
    // Keep the frame, tabs and close target stationary when switching pages.
    // Four resource rows scroll inside the same three-row reading window.
    this.helpHeight = Math.min(832, (this.usableHeight - 96) / this.helpScale);
    this.skin.size(this.helpPanel, 620, this.helpHeight);
    this.helpTitle.node.setPosition(0, this.helpHeight / 2 - 108);
    this.helpTabs.forEach((tab, i) => tab.node.setPosition((i - 1) * 178, this.helpHeight / 2 - 184));
    this.helpBackBox.y = this.helpHeight / 2 - 108; this.helpBackBox.x = 248;
    this.helpViewportHeight = this.helpHeight - 344;
    this.helpViewport.getComponent(UITransform)!.setContentSize(548, this.helpViewportHeight);
    this.helpViewport.setPosition(0, -72);
    this.helpFooter.node.setPosition(0, -this.helpHeight / 2 + 48);
    officeClose(g, this.helpBackBox);
    for (const [i, key] of (['controls', 'bullets', 'resources'] as GuidePage[]).entries()) {
      officeRow(g, { x: (i - 1) * 178, y: this.helpTabs[i].node.position.y, width: 166, height: 72 }, key === page);
      this.helpTabs[i].color = key === page ? new Color(28, 114, 62) : OFFICE.muted.clone();
    }
    this.helpContent.getComponent(UITransform)!.setContentSize(548, Math.max(this.helpViewportHeight, contentHeight));
    this.helpContent.setPosition(0, this.helpViewportHeight / 2);
    this.helpRows.forEach((row, i) => {
      const item = data.rows[i], visible = !!item;
      row.title.node.active = row.body.node.active = row.icon.node.active = visible;
      row.paper.node.active = visible;
      if (!item) return;
      const y = -i * pitch - rowHeight / 2;
      row.paper.clear(); officeRow(row.paper, { x: 0, y, width: 500, height: rowHeight });
      const textX = item.icon ? -112 : -222, textWidth = item.icon ? 334 : 444;
      row.title.node.setPosition(textX, y + 38);
      row.title.node.getComponent(UITransform)!.setAnchorPoint(0, 0.5);
      row.title.node.getComponent(UITransform)!.setContentSize(textWidth, 44);
      row.body.node.setPosition(textX, y - 26);
      row.body.node.getComponent(UITransform)!.setAnchorPoint(0, 0.5);
      row.body.node.getComponent(UITransform)!.setContentSize(textWidth, 72); row.body.lineHeight = 36;
      row.title.string = item.title; row.body.string = item.body;
      row.icon.node.active = !!item.icon;
      row.icon.spriteFrame = this.guideFrames.get(item.icon) || null;
      const frame = row.icon.spriteFrame, ratio = frame ? frame.rect.width / frame.rect.height : 1;
      const w = ratio >= 1 ? 100 : 100 * ratio, h = ratio >= 1 ? 100 / ratio : 100;
      row.icon.node.getComponent(UITransform)!.setContentSize(w, h);
      row.icon.node.setPosition(-186, y);
    });
    this.helpScroll.stopAutoScroll(); this.helpScroll.scrollToTop(0);
    this.helpFooter.string = [contentHeight > this.helpViewportHeight + 1 ? '上滑查看更多' : '', data.footer].filter(Boolean).join(' · ');
    this.helpFooter.node.active = !!this.helpFooter.string;
  }
  hideHelp() { this.helpRoot.active = false; }
  get helpOpen() { return this.helpRoot.active; }
  get exitOpen() { return this.exitRoot.active; }
  showExitConfirmation() { this.setPressed(null); this.exitRoot.active = true; }
  hideExitConfirmation() { this.exitRoot.active = false; this.setPressed(null); }

  /** The overlay changes only on pointer transitions, never rebuilds an entire menu. */
  setPressed(action: MenuAction | null, point?: Point) {
    const g = this.pressedInk; if (!g) return; g.clear();
    if (!action || !point) return;
    let b: HitBox | undefined, scale = 1, offsetY = this.modal.position.y;
    const x = point.x - DESIGN_WIDTH / 2, y = point.y - this.fieldHeight / 2;
    if (this.exitOpen) {
      b = action === 'exit-confirm' ? this.exitConfirmBox : this.exitCancelBox; offsetY = this.safeCenter;
    } else if (this.friends.open) {
      const region = this.friends.feedbackBox(action); if (region) b = region;
      scale = this.friends.scaleValue; offsetY = this.safeCenter;
    } else if (this.helpOpen) {
      scale = this.helpScale; offsetY = this.safeCenter;
      if (action === 'help-close') b = this.helpBackBox;
      else { const i = ['help-controls', 'help-bullets', 'help-resources'].indexOf(action); if (i >= 0) b = { x: (i - 1) * 178, y: this.helpTabs[i].node.position.y, width: 166, height: 72 }; }
    } else if (action === 'help') b = this.helpButton;
    else if (action === 'friends') b = this.friendsButton;
    else if (action === 'primary' && this.mode === 'paused' && officeContains(this.closeButton, x, y - offsetY, this.touchMinimum)) b = this.closeButton;
    else if (action === 'primary' || action === 'secondary' || action === 'sound') b = this.buttons[action];
    if (!b) return;
    g.fillColor = new Color(48, 15, 59, 44);
    g.roundRect((b.x - b.width / 2) * scale, (b.y - b.height / 2) * scale + offsetY,
      b.width * scale, b.height * scale, Math.min(20, b.height / 2) * scale); g.fill();
  }

  update(mode: MenuMode, profile: PlayerProgress, result: Settlement | null, elapsed: number, dt: number) {
    this.mode = mode;
    if (mode !== this.previousMode) this.resultClock = 0;
    this.previousMode = mode; this.resultClock += dt;
    this.resumeRoot.active = mode === 'resuming';
    this.menuArt.active = false; this.modal.setScale(1, 1);
    this.tutorialArt.node.active = false;
    this.panel.node.active = this.mainButton.node.active = this.tutorialBadge.node.active = false;
    this.settingsIcons.forEach(icon => icon.node.active = mode === 'paused');
    this.settingsHelp.node.active = this.settingsClose.node.active = this.settingsState.node.active = mode === 'paused';
    if (mode !== 'paused') this.settingsPaintKey = '';
    this.modal.setPosition(0, -HUD_SAFE_HEIGHT / 2);
    this.title.node.active = this.subtitle.node.active = this.primary.node.active = true;
    this.primary.color = INK.clone();
    this.secondary.color = this.sound.color = INK.clone();
    this.buttons.primary.x = 0; this.buttons.sound.x = 247;
    Object.assign(this.buttons.secondary, { x: 0, width: 270, height: 40 });
    this.secondary.fontSize = 19; this.secondary.lineHeight = 24; this.secondary.isBold = false;
    this.secondary.node.getComponent(UITransform)!.setContentSize(260, 38);
    this.secondaryInk.clear(); this.secondaryInk.node.active = false;
    this.footerPaper.node.active = this.resultBottom.node.active = false;
    this.buttons.primary.width = 480; this.buttons.primary.height = 60;
    this.modal.active = mode === 'home' || mode === 'paused' || mode === 'result' || mode === 'tutorial-intro' || mode === 'tutorial-ready';
    this.friendsEntry.node.active = this.friendsEntryInk.node.active = mode === 'home' || mode === 'result' || mode === 'paused';
    this.friendsEntry.string = mode === 'paused' ? '好友排行' : '好友积分榜';
    if (this.friends.open || this.helpOpen) { this.modal.active = false; return; }
    if (!this.modal.active) return;
    const isResult = mode === 'result';
    const isReady = mode === 'tutorial-ready';
    const isIntro = mode === 'tutorial-intro';
    for (const label of [this.rank, this.score, this.detail, this.goal, ...this.statTitles, ...this.statValues]) label.node.active = isResult;
    this.hero.node.active = mode === 'home';
    this.record.node.active = !isIntro && !isReady && (mode !== 'home' || profile.runs > 0);
    this.sound.node.active = mode === 'paused';
    this.title.fontSize = isResult ? 30 : isIntro ? 29 : isReady ? 34 : 44;
    this.title.lineHeight = this.title.fontSize + 6;
    this.title.enableWrapText = isIntro;
    this.title.node.getComponent(UITransform)!.setContentSize(isIntro ? 510 : 430, isIntro ? 86 : 54);
    this.title.string = isResult ? '摸鱼成绩单' : isIntro ? TUTORIAL_COPY.introTitle : isReady ? TUTORIAL_COPY.completeTitle : mode === 'paused' ? '摸鱼设置' : '摸鱼请走位';
    this.title.node.setPosition(0, isResult ? 249 : isIntro ? 180 : 171);
    this.subtitle.string = isResult ? '工作堆满，回去开工' : isIntro ? TUTORIAL_COPY.introSubtitle : isReady ? TUTORIAL_COPY.completeSubtitle : mode === 'paused' ? '调整声音，准备好了继续摸鱼' : '躲开工作，享受片刻摸鱼';
    this.subtitle.enableWrapText = isIntro;
    this.subtitle.node.getComponent(UITransform)!.setContentSize(510, isIntro ? 64 : 32);
    this.subtitle.node.setPosition(0, isResult ? 210 : isIntro ? 83 : 115);
    this.hero.node.getComponent(UITransform)!.setContentSize(isIntro ? 132 : isReady ? 168 : 170, isIntro ? 132 : isReady ? 168 : 170);
    this.hero.node.setPosition(0, isIntro ? -45 : isReady ? 0 : 35);
    this.sound.string = profile.soundEnabled ? '声音 开' : '声音 关';
    const buttonY = isResult ? -212 : isIntro ? -172 : isReady ? -174 : -118;
    this.buttons.primary.y = buttonY; this.buttons.secondary.y = isResult ? -269 : -179;
    this.buttons.sound.y = isResult ? 255 : 217;
    this.primary.node.setPosition(0, buttonY); this.secondary.node.setPosition(0, this.buttons.secondary.y);
    this.sound.node.setPosition(247, this.buttons.sound.y);
    this.primary.string = isResult ? '再来一局' : isIntro ? TUTORIAL_COPY.practice : isReady ? TUTORIAL_COPY.start : mode === 'paused' ? '继续摸鱼' : '开始摸鱼';
    this.secondary.node.active = mode === 'home' || mode === 'paused';
    this.secondary.string = mode === 'home' ? '操作教学' : '返回首页';
    this.record.node.setPosition(0, isResult ? 44 : -45);
    this.record.node.getComponent(UITransform)!.setContentSize(510, 36);
    this.record.enableWrapText = false;
    this.record.color = new Color(63, 116, 71);
    if (isResult && result) {
      this.rank.string = result.rank;
      const progress = Math.min(1, this.resultClock / 0.5);
      this.score.string = String(Math.round(result.score * (1 - (1 - progress) ** 3))).padStart(6, '0');
      this.record.string = result.firstRun ? `首局纪录 · ${result.bestScore} 分`
        : result.newRecord ? `新纪录！比上次多 ${result.score - result.previousBest} 分`
        : `个人最佳 ${result.bestScore} 分 · 还差 ${result.bestScore - result.score + 1} 分超越`;
      const titles = ['摸鱼时长', '抵达波次', '最高连击'];
      const values = [formatClock(result.seconds), `第 ${result.wave} 波`, `${result.maxCombo} 次`];
      this.statTitles.forEach((label, index) => label.string = titles[index]);
      this.statValues.forEach((label, index) => label.string = values[index]);
      this.detail.string = `穿缝 ${result.gaps} 次  ·  甩脱 ${result.breaks} 次`;
      this.goal.string = result.goal;
    } else this.record.string = isIntro || isReady ? '' : mode === 'paused' ? `已摸鱼 ${formatClock(elapsed)}`
      : profile.runs > 0 ? `个人最佳 ${profile.bestScore} 分 · 最久 ${formatClock(profile.bestSeconds)}` : '拖动躲避 · 集鱼开盾';
    if (mode === 'paused') { this.layoutSettings(profile); return; }
    this.drawBoard(isResult);
    if ((isIntro && this.tutorialIntroFrame) || (isReady && this.tutorialCompleteFrame)) {
      this.layoutTutorial(isIntro); return;
    }
    if ((mode === 'home' && this.homeFrame) || (isResult && this.resultFrame && result)) {
      this.layoutApproved(mode === 'home', profile, result);
    }
    if (this.friendsEntry.node.active) {
      if (!this.menuArt.active) {
        Object.assign(this.friendsButton, { x: 0, y: -280, width: 240, height: 48 });
      }
      const b = this.friendsButton;
      this.friendsEntry.node.setPosition(b.x, b.y);
      this.friendsEntry.node.getComponent(UITransform)!.setContentSize(b.width - 12, b.height);
      this.friendsEntry.fontSize = this.menuArt.active ? 36 * this.cardScale : 21;
      this.friendsEntry.lineHeight = this.friendsEntry.fontSize + 5;
      const g = this.friendsEntryInk; g.clear();
      this.drawFooterButton(g, b, true);
    }
  }

  private layoutTutorial(intro: boolean) {
    this.board.clear(); this.modal.setPosition(0, this.safeCenter);
    const s = Math.min(1, (DESIGN_WIDTH - 96) / 656, (this.usableHeight - 144) / (intro ? 536 : 360));
    this.panel.node.active = intro;
    if (intro) {
      this.skin.size(this.panel, 620 * s, 450 * s);
      officeUnderline(this.board, 330 * s, 83 * s);
    } else officeNotice(this.board, 620 * s, 300 * s);
    this.tutorialArt.node.active = false; this.hero.node.active = this.record.node.active = false;
    this.title.node.active = this.subtitle.node.active = true;
    this.title.string = intro ? TUTORIAL_COPY.introTitle : TUTORIAL_COPY.completeTitle;
    this.title.isBold = true;
    this.title.fontSize = (intro ? 44 : 38) * s; this.title.lineHeight = this.title.fontSize + 6 * s;
    this.title.node.setPosition(0, (intro ? 126 : 90) * s);
    this.title.node.getComponent(UITransform)!.setContentSize(510 * s, 60 * s);
    this.subtitle.string = intro ? TUTORIAL_COPY.introSubtitle.replace('之前', '之前\n') : TUTORIAL_COPY.completeSubtitle;
    this.subtitle.fontSize = 28 * s; this.subtitle.lineHeight = 38 * s; this.subtitle.enableWrapText = true;
    this.subtitle.color = OFFICE.muted.clone();
    this.subtitle.node.setPosition(0, (intro ? 4 : 15) * s);
    this.subtitle.node.getComponent(UITransform)!.setContentSize((intro ? 450 : 490) * s, 88 * s);
    this.tutorialBadge.node.active = false;
    const buttonY = (intro ? -132 : -90) * s, buttonHeight = (intro ? 88 : 76) * s;
    Object.assign(this.buttons.primary, { x: 0, y: buttonY, width: 532 * s, height: buttonHeight });
    this.mainButton.node.active = true; this.mainButton.node.setPosition(0, buttonY);
    this.skin.size(this.mainButton, 532 * s, buttonHeight);
    this.primary.node.setPosition(0, buttonY); this.primary.fontSize = 34 * s;
    this.primary.node.getComponent(UITransform)!.setContentSize(500 * s, 70 * s);
    this.primary.color = INK.clone();
  }

  private layoutSettings(profile: PlayerProgress) {
    this.modal.setPosition(0, this.safeCenter);
    const s = Math.min(1, (DESIGN_WIDTH - 72) / 644, (this.usableHeight - 96) / 850);
    const box = (x: number, y: number, width: number, height: number): HitBox => ({ x: x * s, y: y * s, width: width * s, height: height * s });
    const label = (l: Label, x: number, y: number, width: number, height: number, size: number) => {
      l.node.setPosition(x * s, y * s); l.node.getComponent(UITransform)!.setContentSize(width * s, height * s);
      l.fontSize = size * s; l.lineHeight = l.fontSize + 5; l.isBold = true; l.color = INK.clone();
    };
    const rows = [170, 50, -70];
    Object.assign(this.buttons.sound, box(0, rows[0], 532, 90));
    Object.assign(this.helpButton, box(0, rows[1], 532, 90));
    Object.assign(this.friendsButton, box(0, rows[2], 532, 90));
    Object.assign(this.buttons.primary, box(0, -190, 532, 94));
    Object.assign(this.buttons.secondary, box(0, -312, 204, 64));
    Object.assign(this.closeButton, box(248, 280, 56, 56));
    label(this.title, 0, 280, 440, 60, 43);
    this.subtitle.node.active = this.record.node.active = false;
    this.sound.string = '声音'; label(this.sound, 0, rows[0], 300, 70, 30);
    label(this.settingsHelp, 0, rows[1], 300, 70, 30);
    label(this.friendsEntry, 0, rows[2], 300, 70, 30);
    label(this.primary, 0, -190, 510, 80, 39);
    label(this.secondary, 0, -312, 174, 54, 29);
    this.settingsClose.node.active = false;
    this.settingsState.string = profile.soundEnabled ? '开' : '关';
    label(this.settingsState, profile.soundEnabled ? 166 : 207, rows[0], 35, 44, 22);
    this.friendsEntryInk.node.active = this.secondaryInk.node.active = false;
    const key = `${s}:${profile.soundEnabled}`;
    this.panel.node.active = this.mainButton.node.active = true;
    this.skin.size(this.panel, 620 * s, 790 * s);
    this.skin.size(this.mainButton, 532 * s, 94 * s); this.mainButton.node.setPosition(0, -190 * s);
    this.settingsIcons.forEach((icon, i) => {
      icon.node.active = i < 3;
      this.skin.size(icon, 76 * s, 76 * s);
      icon.node.setPosition(-178 * s, (rows[i] || 0) * s);
    });
    if (key === this.settingsPaintKey) return;
    this.settingsPaintKey = key;
    const g = this.board; g.clear();
    rows.forEach(y => officeRow(g, box(0, y, 500, 90)));
    officeSwitch(g, box(185, rows[0], 110, 54), profile.soundEnabled);
    officeChevron(g, 232 * s, rows[1] * s, 22 * s);
    officeChevron(g, 232 * s, rows[2] * s, 22 * s);
    officeButton(g, this.buttons.secondary, 'cream');
    officeClose(g, this.closeButton);
  }

  private layoutApproved(home: boolean, profile: PlayerProgress, result: Settlement | null) {
    // The result artwork has wider transparent padding on the right. Center its
    // paper/replay button, and use the same origin for artwork, labels and input.
    this.cardCenterX = home ? 609 : 558.5;
    const hasRecord = profile.runs > 0;
    const contentHeight = home && !hasRecord ? 1060 : 1200;
    const footerHeight = 140;
    this.cardHeight = contentHeight + footerHeight + 91;
    this.cardScale = Math.min((DESIGN_WIDTH - 24) / 1218, (this.usableHeight - 120) / this.cardHeight);
    this.modal.setPosition(0, this.safeCenter);
    this.menuArt.active = true; this.menuArt.setScale(this.cardScale, this.cardScale);
    this.board.clear();
    this.homeArt.node.active = this.homeBottom.node.active = home;
    this.homeNumberPatch.node.active = this.homeNumber.node.active = home && hasRecord;
    this.homeArt.spriteFrame = hasRecord ? this.homeFrame! : this.compactHomeFrame!;
    this.place(this.homeArt, 0, 0, 1218, contentHeight);
    this.place(this.homeBottom, 0, contentHeight + footerHeight, 1218, 91);
    this.footerPaper.node.active = true;
    this.footerPaper.spriteFrame = home ? (hasRecord ? this.homeFooterFrame! : this.compactHomeFooterFrame!) : this.resultFooterFrame!;
    this.place(this.footerPaper, 0, contentHeight, 1218, footerHeight);
    this.place(this.homeNumberPatch, 621, 1107, 249, 77);
    this.homeNumber.string = String(Math.floor(profile.bestScore)).padStart(6, '0');
    this.homeNumber.node.setPosition(747 - this.cardCenterX, this.cardHeight / 2 - 1146);
    this.resultArt.node.active = this.resultBottom.node.active = !home;
    this.place(this.resultArt, 0, 0, 1218, 1200);
    this.place(this.resultBottom, 0, contentHeight + footerHeight, 1218, 91);
    for (const patch of this.resultPatches) {
      patch.node.active = !home;
      const box = this.resultPatchBoxes.get(patch)!;
      this.place(patch, box[0], box[1], box[2], box[3]);
    }
    this.stamp.node.active = this.stampInk.node.active = !home;
    for (const label of [this.title, this.subtitle, this.hero, this.record]) label.node.active = false;
    // Button copy is already drawn in the supplied artwork; preserve the logical label for QA/input.
    this.primary.color = new Color(0, 0, 0, 0);
    const button = home ? [193, 851, 823, 180] : [169, 1057, 779, 128];
    Object.assign(this.buttons.primary, {
      x: (button[0] + button[2] / 2 - this.cardCenterX) * this.cardScale,
      y: (this.cardHeight / 2 - button[1] - button[3] / 2) * this.cardScale,
      width: button[2] * this.cardScale, height: button[3] * this.cardScale,
    });
    this.primary.node.setPosition(this.buttons.primary.x, this.buttons.primary.y);
    const footerY = (this.cardHeight / 2 - contentHeight - footerHeight / 2) * this.cardScale;
    Object.assign(this.friendsButton, { x: home ? -214 * this.cardScale : this.buttons.primary.x, y: footerY,
      width: (home ? 382 : 700) * this.cardScale, height: 92 * this.cardScale });
    Object.assign(this.buttons.secondary, { x: 214 * this.cardScale, y: footerY,
      width: 382 * this.cardScale, height: 92 * this.cardScale });
    this.secondary.node.setPosition(this.buttons.secondary.x, footerY);
    this.secondary.node.getComponent(UITransform)!.setContentSize(this.buttons.secondary.width - 12, this.buttons.secondary.height);
    this.secondary.fontSize = 36 * this.cardScale; this.secondary.lineHeight = this.secondary.fontSize + 5;
    this.secondary.color = INK.clone(); this.secondary.isBold = true;
    this.secondaryInk.node.active = home;
    if (home) this.drawFooterButton(this.secondaryInk, this.buttons.secondary, false);
    if (home || !result) return;
    const live = (label: Label, x: number, y: number, width: number, height: number, size: number) => {
      label.node.setPosition((x + width / 2 - this.cardCenterX) * this.cardScale,
        (this.cardHeight / 2 - y - height / 2) * this.cardScale);
      label.node.getComponent(UITransform)!.setContentSize(width * this.cardScale, height * this.cardScale);
      label.fontSize = size * this.cardScale; label.lineHeight = label.fontSize + 4;
      label.color = new Color(38, 7, 48);
    };
    live(this.rank, 370, 469, 358, 70, 48);
    live(this.score, 327, 554, 464, 136, 112);
    this.statValues.forEach((label, i) => live(label, 165 + i * 282, 793, 221, 65, 54));
    for (const label of this.statTitles) label.node.active = false;
    live(this.detail, 327, 882, 455, 55, 35);
    live(this.goal, 299, 960, 589, 63, 33);
    this.goal.color = new Color(8, 78, 40);
    const sx = 866 - this.cardCenterX, sy = this.cardHeight / 2 - 497;
    this.stamp.string = result.rank.charAt(0); this.stamp.node.setPosition(sx, sy);
    const ink = this.stampInk; ink.clear();
    const purple = new Color(176, 26, 219), paper = new Color(255, 244, 217);
    // Filled rings stay crisp when the complete card scales down on a phone.
    for (const [radius, color] of [[73, purple], [67, paper], [63, purple], [59, paper]] as [number, Color][]) {
      ink.fillColor = color; ink.circle(sx, sy, radius); ink.fill();
    }
    ink.strokeColor = purple; ink.lineWidth = 6;
    for (let i = 0; i < 3; i++) {
      ink.moveTo(sx + 82, sy + 38 - i * 38);
      ink.bezierCurveTo(sx + 105, sy + 63 - i * 38, sx + 118, sy + 13 - i * 38, sx + 145, sy + 38 - i * 38); ink.stroke();
    }
  }

  private drawFooterButton(g: Graphics, b: HitBox, emphasized: boolean) {
    g.clear(); officeButton(g, b, emphasized ? 'gold' : 'cream');
  }

  updateCountdown(remaining: number) {
    this.countdown.string = String(Math.max(1, Math.ceil(remaining)));
  }

  showResourceLoading(status: string, failed: boolean, progress = 0) {
    if (this.loadingFailed && !failed) this.loadingProgress = 0;
    this.loading = true; this.loadingFailed = failed;
    this.loadingRoot.active = true; this.modal.active = false;
    this.loadingProgress = Math.max(this.loadingProgress, Math.min(1, Math.max(0, progress)));
    // One full poster and one animated interior, in the same original coordinates.
    // Contain keeps the printed loading bar visible on short and tall screens.
    const posterScale = Math.min(DESIGN_WIDTH / 1080, this.fieldHeight / 2400);
    this.loadingCanvas.setScale(posterScale, posterScale);
    const backdrop = this.loadingBackdrop; backdrop.clear(); backdrop.fillColor = new Color(32, 44, 80);
    backdrop.rect(-DESIGN_WIDTH / 2, -this.fieldHeight / 2, DESIGN_WIDTH, this.fieldHeight); backdrop.fill();
    if (this.loadingFill.spriteFrame) this.loadingFill.fillRange = this.loadingProgress;
    this.loadingFishMask.setPosition(129 + 84 + (827 - 168) * this.loadingProgress - 540, 1200 - 2069);
    this.loadingStatus.string = !failed && status.startsWith('正在') ? status : '';
    this.loadingStatus.node.active = this.loadingStatus.string.length > 0;
    this.loadingStatus.color = INK.clone();
    this.loadingStatus.node.setPosition(16, -this.fieldHeight / 2 + 56);
    this.loadingReconnect.clear();
    if (this.loadingStatus.node.active) {
      this.loadingReconnect.node.setPosition(0, -this.fieldHeight / 2 + 56);
      officeNotice(this.loadingReconnect, 620, 64, 'task');
    }
    const retryScale = Math.min(1, (DESIGN_WIDTH - 64) / 564, (this.fieldHeight - 120) / 460);
    this.retryRoot.active = failed;
    this.retryRoot.setScale(retryScale, retryScale);
    this.retryRoot.setPosition(0, -this.fieldHeight * 0.12);
    this.buttons.primary.x = 0; this.buttons.primary.y = this.retryRoot.position.y - 74 * retryScale;
    this.buttons.primary.width = 432 * retryScale; this.buttons.primary.height = 72 * retryScale;
    this.primary.string = status;
  }

  finishLoading() { this.loading = false; this.loadingFailed = false; this.loadingRoot.active = false; this.retryRoot.active = false; this.loadingProgress = 0; }

  private drawBoard(result: boolean) {
    const g = this.board; g.clear(); const bottom = result ? -305 : -245, height = result ? 610 : 490;
    g.fillColor = new Color(55, 39, 65, 60); g.roundRect(-298, bottom - 7, 608, height, 24); g.fill();
    g.fillColor = CREAM; g.strokeColor = INK; g.lineWidth = 3;
    g.roundRect(-304, bottom, 608, height, 24); g.fill(); g.stroke();
    if (result) {
      g.fillColor = new Color(245, 226, 193); g.roundRect(-260, 147, 520, 39, 12); g.fill();
      for (let i = 0; i < 3; i++) { g.fillColor = new Color(248, 233, 207); g.roundRect((i - 1) * 176 - 82, -56, 164, 72, 12); g.fill(); }
      g.fillColor = new Color(233, 242, 212); g.roundRect(-270, -166, 540, 59, 12); g.fill();
    }
    const button = this.buttons.primary;
    g.fillColor = new Color(117, 196, 109); g.strokeColor = new Color(59, 111, 64); g.lineWidth = 2;
    g.roundRect(-button.width / 2, button.y - button.height / 2, button.width, button.height, 15); g.fill(); g.stroke();
    if (this.sound.node.active) {
      g.fillColor = new Color(243, 228, 202);
      const sound = this.buttons.sound; g.roundRect(sound.x - 36, sound.y - 19, 72, 38, 10); g.fill();
    }
  }

  placeReward(fish: Point, cat: Point) {
    const point = tutorialRewardPosition(fish, cat, this.fieldHeight);
    this.rewardRoot.setPosition(point.x - DESIGN_WIDTH / 2, point.y - this.fieldHeight / 2);
  }

  updateGuide(guide: TutorialGuide, showShieldHint: boolean, cue?: { player: Point; target?: Point; time: number }) {
    this.rewardRoot.active = this.mode === 'hidden' && guide.rewarding;
    this.guideRoot.active = this.mode === 'hidden' && ((guide.playing && !guide.rewarding) || guide.step === 'practice-retry' || showShieldHint);
    this.drawTutorialCue(guide, cue);
    const stars = this.rewardStars; stars.clear();
    if (this.rewardRoot.active) {
      this.rewardLabel.string = guide.feedback;
      const progress = guide.rewardProgress;
      const pop = Math.min(1, progress / 0.24) - 1;
      const scale = 0.6 + 0.4 * (1 + 2.70158 * pop ** 3 + 1.70158 * pop ** 2);
      this.rewardRoot.setScale(scale, scale);
      this.rewardOpacity.opacity = Math.round(255 * Math.min(1, (1 - progress) / 0.17));
      this.rewardLabel.node.setPosition(0, 0);
      stars.lineWidth = 1.6; stars.strokeColor = INK;
      for (let i = 0; i < 6; i++) {
        const angle = i * Math.PI / 3 + Math.PI / 6;
        const x = Math.cos(angle) * (182 + progress * 18);
        const y = Math.sin(angle) * (30 + progress * 10);
        const size = 5 + Math.sin(progress * Math.PI) * 3;
        stars.fillColor = i % 2 === 0 ? new Color(255, 220, 113) : new Color(255, 246, 209);
        for (let point = 0; point < 10; point++) {
          const direction = point * Math.PI / 5 - Math.PI / 2 + progress * 0.6;
          const radius = point % 2 === 0 ? size : size * 0.42;
          const px = x + Math.cos(direction) * radius, py = y + Math.sin(direction) * radius;
          if (point === 0) stars.moveTo(px, py); else stars.lineTo(px, py);
        }
        stars.close(); stars.fill(); stars.stroke();
      }
    }
    if (!this.guideRoot.active) return;
    this.guideTitle.string = showShieldHint ? '能量已满' : guide.title;
    this.guideText.string = showShieldHint ? '松手后双击，免疫 3 秒。' : guide.text;
    this.guideTitle.node.setPosition(0, 43);
    this.guideText.node.setPosition(0, -17);
    this.guideText.node.getComponent(UITransform)!.setContentSize(560, 80);
    this.guideText.enableWrapText = true;
    const g = this.guideBoard; g.clear();
    // A lightweight paper slip, leaving the field and collectible artwork visible.
    g.fillColor = new Color(48, 15, 59, 45); g.roundRect(-310, -87, 620, 164, 20); g.fill();
    g.fillColor = new Color(244, 202, 130); g.roundRect(-310, -80, 620, 164, 20); g.fill();
    g.fillColor = OFFICE.paper; g.roundRect(-306, -76, 612, 156, 17); g.fill();
    g.fillColor = new Color(255, 253, 238); g.roundRect(-292, 70, 584, 5, 2.5); g.fill();
    g.fillColor = OFFICE.gold; g.roundRect(-296, -54, 6, 108, 3); g.fill();
    g.strokeColor = new Color(226, 193, 142); g.lineWidth = 1.5;
    g.moveTo(-220, 19); g.lineTo(220, 19); g.stroke();
  }

  /** Native vector guidance animates with game time and never captures touch input. */
  private drawTutorialCue(guide: TutorialGuide, cue?: { player: Point; target?: Point; time: number }) {
    this.tutorialCueRoot.active = this.mode === 'hidden' && !!cue?.target && (guide.step === 'fish' || guide.step === 'agent');
    const wasHandActive = this.tapHandRoot.active;
    this.tapHandRoot.active = this.mode === 'hidden' && guide.step === 'shield' && !!cue;
    const g = this.tutorialCue; g.clear();
    if (!cue) return;
    if (this.tutorialCueRoot.active && cue.target) {
      const route = tutorialPickupRoute(cue.player, cue.target);
      const at = (distance: number) => {
        const i = Math.max(1, route.points.findIndex(point => point.distance >= distance));
        const a = route.points[i - 1], b = route.points[i];
        const t = Math.max(0, Math.min(1, (distance - a.distance) / Math.max(0.01, b.distance - a.distance)));
        return { x: a.x + (b.x - a.x) * t - DESIGN_WIDTH / 2,
          y: a.y + (b.y - a.y) * t - this.fieldHeight / 2 };
      };
      // Rounded, two-tone dashes flow towards the pickup, along a softly bowed route.
      const segment = (a: Point, b: Point, width: number, color: Color) => {
        g.strokeColor = color; g.lineWidth = width;
        g.moveTo(a.x, a.y); g.lineTo(b.x, b.y); g.stroke();
        g.fillColor = color; g.circle(a.x, a.y, width / 2); g.fill(); g.circle(b.x, b.y, width / 2); g.fill();
      };
      for (let distance = 85 + (cue.time * 34) % 38; distance < route.length - 94; distance += 38) {
        const a = at(distance), b = at(Math.min(distance + 16, route.length - 94));
        segment({ x: a.x, y: a.y - 2 }, { x: b.x, y: b.y - 2 }, 11, new Color(48, 15, 59, 100));
        segment(a, b, 9, OFFICE.paper);
        segment(a, b, 4, new Color(255, 194, 66));
      }
      if (route.length > 190) {
        const tip = at(route.length - 70), before = at(route.length - 90);
        const angle = Math.atan2(tip.y - before.y, tip.x - before.x);
        const nx = Math.cos(angle), ny = Math.sin(angle);
        const a = { x: tip.x - nx * 15 - ny * 11, y: tip.y - ny * 15 + nx * 11 };
        const b = { x: tip.x - nx * 15 + ny * 11, y: tip.y - ny * 15 - nx * 11 };
        segment(a, tip, 10, OFFICE.paper); segment(tip, b, 10, OFFICE.paper);
        segment(a, tip, 4, OFFICE.gold); segment(tip, b, 4, OFFICE.gold);
      }
      const tx = route.target.x - DESIGN_WIDTH / 2, ty = route.target.y - this.fieldHeight / 2;
      const breathe = (Math.sin(cue.time * 3) + 1) / 2;
      g.fillColor = new Color(255, 237, 159, 24 + breathe * 16); g.circle(tx, ty, 57 + breathe * 4); g.fill();
      g.strokeColor = new Color(255, 246, 209, 215); g.lineWidth = 2.5; g.circle(tx, ty, 48); g.stroke();
      g.strokeColor = new Color(255, 202, 76, 115 - breathe * 50); g.lineWidth = 3;
      g.circle(tx, ty, 57 + breathe * 7); g.stroke();
      // Four tiny glints highlight the resource without obscuring its icon or wings.
      g.fillColor = OFFICE.paper;
      for (let i = 0; i < 4; i++) {
        const angle = i * Math.PI / 2 + Math.PI / 4;
        const sx = tx + Math.cos(angle) * 57, sy = ty + Math.sin(angle) * 57;
        const size = 3 + breathe;
        g.moveTo(sx, sy + size * 1.7); g.lineTo(sx + size, sy); g.lineTo(sx, sy - size * 1.7);
        g.lineTo(sx - size, sy); g.close(); g.fill();
      }
    }
    if (!this.tapHandRoot.active) return;
    const finger = this.tapHand; finger.clear();
    if (!wasHandActive) this.tapStartedAt = cue.time;
    const phase = (cue.time - this.tapStartedAt) % 2.2;
    const pulse = Math.max(0, 1 - Math.abs(phase - 0.36) / 0.16, 1 - Math.abs(phase - 0.72) / 0.16);
    // Anchor the demonstration in free space instead of chasing every small player movement.
    if (!wasHandActive || !this.tapAnchor || Math.abs(cue.player.x - this.tapAnchor.x) < 115
      && cue.player.y > this.tapAnchor.y - 215 && cue.player.y < this.tapAnchor.y + 110) {
      this.tapAnchor = tutorialTapPosition(cue.player, this.fieldHeight, this.guideRoot.position.y + this.fieldHeight / 2 + 84);
    }
    const anchor = this.tapAnchor;
    this.tapHandRoot.setPosition(anchor.x - DESIGN_WIDTH / 2, anchor.y - this.fieldHeight / 2);
    finger.fillColor = new Color(255, 244, 200, 38); finger.circle(0, 10, 40); finger.fill();
    finger.strokeColor = new Color(255, 245, 206, 190); finger.lineWidth = 3; finger.circle(0, 10, 29); finger.stroke();
    // Two distinct contacts, then a pause. Ripples stay attached to the touch point.
    for (const start of [0.36, 0.72]) {
      const age = phase - start;
      if (age < 0 || age > 0.52) continue;
      finger.strokeColor = new Color(255, 221, 109, Math.round(230 * (1 - age / 0.52)));
      finger.lineWidth = 4; finger.circle(0, 10, 29 + age * 72); finger.stroke();
    }
    const dip = -pulse * 7;
    const silhouette = (ox: number, oy: number) => {
      finger.moveTo(-18 + ox, -91 + oy);
      finger.bezierCurveTo(-27 + ox, -78 + oy, -40 + ox, -61 + oy, -46 + ox, -49 + oy);
      finger.bezierCurveTo(-54 + ox, -32 + oy, -36 + ox, -24 + oy, -27 + ox, -37 + oy);
      finger.lineTo(-14 + ox, -51 + oy); finger.lineTo(-14 + ox, 2 + oy);
      finger.bezierCurveTo(-14 + ox, 24 + oy, 14 + ox, 24 + oy, 14 + ox, 2 + oy);
      finger.lineTo(14 + ox, -34 + oy);
      finger.bezierCurveTo(19 + ox, -21 + oy, 35 + ox, -24 + oy, 35 + ox, -38 + oy);
      finger.bezierCurveTo(40 + ox, -28 + oy, 54 + ox, -33 + oy, 54 + ox, -47 + oy);
      finger.bezierCurveTo(67 + ox, -44 + oy, 67 + ox, -60 + oy, 63 + ox, -72 + oy);
      finger.lineTo(52 + ox, -96 + oy); finger.bezierCurveTo(31 + ox, -106 + oy, 0 + ox, -105 + oy, -18 + ox, -91 + oy);
      finger.close();
    };
    finger.fillColor = new Color(48, 15, 59, 70); silhouette(4, dip - 5); finger.fill();
    finger.fillColor = new Color(255, 233, 192); finger.strokeColor = INK; finger.lineWidth = 4;
    silhouette(0, dip); finger.fill(); finger.stroke();
    finger.fillColor = new Color(255, 252, 235);
    finger.roundRect(-9, -48 + dip, 17, 62, 8); finger.fill();
    finger.ellipse(17, -66 + dip, 26, 21); finger.fill();
    finger.strokeColor = new Color(199, 148, 121); finger.lineWidth = 2.5;
    for (const [x, y] of [[20, -47], [40, -49], [55, -58]]) {
      finger.moveTo(x, y + dip); finger.lineTo(x - 1, y - 12 + dip); finger.stroke();
    }
    finger.fillColor = new Color(70, 158, 221); finger.strokeColor = INK; finger.lineWidth = 4;
    finger.roundRect(-21, -119 + dip, 77, 27, 8); finger.fill(); finger.stroke();
    finger.fillColor = new Color(136, 220, 250); finger.roundRect(-15, -114 + dip, 64, 6, 3); finger.fill();
    finger.fillColor = new Color(255, 250, 226); finger.circle(44, -104 + dip, 3); finger.fill();
  }

  actionAt(point: Point): MenuAction | null {
    const x = point.x - DESIGN_WIDTH / 2, y = point.y - this.fieldHeight / 2;
    if (this.exitOpen) {
      if (officeContains(this.exitCancelBox, x, y - this.safeCenter, this.touchMinimum)) return 'exit-cancel';
      if (officeContains(this.exitConfirmBox, x, y - this.safeCenter, this.touchMinimum)) return 'exit-confirm';
      return null;
    }
    if (this.loading) {
      const b = this.buttons.primary;
      return this.loadingFailed && Math.abs(x - b.x) <= b.width / 2 && Math.abs(y - b.y) <= b.height / 2 ? 'primary' : null;
    }
    if (this.friends.open) return this.friends.actionAt(point);
    if (this.helpOpen) {
      const b = this.helpBackBox;
      const hx = x / this.helpScale, hy = (y - this.safeCenter) / this.helpScale;
      if (officeContains(b, hx, hy, this.touchMinimum / this.helpScale)) return 'help-close';
      for (const [i, action] of (['help-controls', 'help-bullets', 'help-resources'] as MenuAction[]).entries())
        if (officeContains({ x: (i - 1) * 178, y: this.helpTabs[i].node.position.y, width: 166, height: 72 }, hx, hy, this.touchMinimum / this.helpScale)) return action;
      return null;
    }
    if (!this.modal.active) return null;
    const localY = y - this.modal.position.y;
    if (this.mode === 'paused') {
      for (const [b, action] of [[this.helpButton, 'help'], [this.closeButton, 'primary']] as [HitBox, MenuAction][]) {
        if (officeContains(b, x, localY, this.touchMinimum)) return action;
      }
    }
    const friends = this.friendsButton;
    if (this.friendsEntry.node.active && officeContains(friends, x, localY, this.touchMinimum)) return 'friends';
    for (const name of ['sound', 'primary', 'secondary'] as const) {
      if (!this[name].node.active) continue;
      const box = this.buttons[name];
      if (officeContains(box, x, localY, this.touchMinimum)) return name;
    }
    return null;
  }
}

/** A complete paper-card shell; private friend rows and own rank are drawn only by WeChat. */
export class FriendLeaderboardView {
  private skin = new OfficeSkin();
  readonly root: Node;
  readonly card: Node;
  readonly dataRoot: Node;
  readonly dataSurface: Node;
  readonly fallback: Node;
  readonly notice: Label;
  readonly back: Label;
  private backdrop: Graphics;
  private body: Label;
  private fallbackTitle: Label;
  private own: Label;
  private height = 1600;
  private scale = 1;
  private shared?: SubContextView;
  private noticeTimer = 0;
  private panel: Sprite;
  private paper: Graphics;
  private ownPaper: Graphics;
  private dataViewport: Node;
  private scroll: ScrollView;
  private usableHeight = 1600;
  private center = 0;
  private minimumTouch = 96;
  private privacy = false;
  private available = false;
  private panelHeight = 820;
  private readonly buttons = {
    'friends-refresh': { x: -132, y: -486, width: 248, height: 68 },
    'friends-share': { x: 132, y: -486, width: 248, height: 68 },
  };
  readonly closeButton = { x: 246, y: 530, width: 58, height: 58 };
  constructor(parent: Node) {
    this.root = new Node('FriendsLeaderboard'); parent.addChild(this.root);
    this.backdrop = this.graphics('FriendsBackdrop', this.root);
    this.card = new Node('FriendsPaperCard'); this.root.addChild(this.card);
    this.panel = this.skin.sprite(this.card, 'FriendsPaintedPanel', 'uiPanel', 636, 820, true);
    const paper = this.paper = this.graphics('FriendsPaper', this.card);

    officeClose(paper, this.closeButton);
    this.label('FriendsTitle', '好友摸鱼榜', 40, 0, 490, 420, 58, true);
    this.label('FriendsSubtitle', '最高分 TOP 10', 27, 0, 448, 540, 40);
    this.dataViewport = new Node('PrivateFriendScrollViewport'); this.card.addChild(this.dataViewport);
    this.dataViewport.addComponent(UITransform).setContentSize(540, 792);
    this.dataViewport.addComponent(Mask).type = Mask.Type.GRAPHICS_RECT;
    this.dataRoot = new Node('PrivateFriendRows'); this.dataViewport.addChild(this.dataRoot);
    this.dataRoot.addComponent(UITransform).setContentSize(520, 1040);
    this.dataRoot.getComponent(UITransform)!.setAnchorPoint(0.5, 1);
    // Scroll content is top-anchored; SubContextView creates a centered sprite.
    // Give it a separate centered surface so its first row starts at the top.
    this.dataSurface = new Node('PrivateFriendCanvas'); this.dataRoot.addChild(this.dataSurface);
    this.dataSurface.addComponent(UITransform).setContentSize(520, 1040);
    this.dataSurface.setPosition(0, -520); this.dataSurface.active = false;
    this.scroll = this.dataViewport.addComponent(ScrollView); this.scroll.content = this.dataRoot;
    this.scroll.horizontal = false; this.scroll.vertical = true;
    this.fallback = new Node('FriendsUnavailable'); this.card.addChild(this.fallback);
    this.fallbackTitle = this.label('FriendsUnavailableTitle', '', 27, 0, 110, 540, 42, true, this.fallback);
    this.fallbackTitle.node.active = false;
    this.body = this.label('FriendsUnavailableBody', '暂无好友积分排名', 30, 0, 40, 520, 120, false, this.fallback);
    this.body.enableWrapText = true;
    const ownPaper = this.ownPaper = this.graphics('FriendsLocalRecordPaper', this.fallback);
    officeRow(ownPaper, { x: 0, y: -329, width: 508, height: 105 });
    this.own = this.label('FriendsLocalRecord', '', 28, 0, -329, 490, 80, true, this.fallback);
    this.own.enableWrapText = true;
    this.notice = this.label('FriendsNotice', '', 24, 0, -428, 540, 40);
    this.notice.node.active = false;
    this.notice.enableWrapText = true;
    for (const box of Object.values(this.buttons)) officeButton(paper, box, 'cream');
    this.label('FriendsRefresh', '刷新榜单', 28, -132, -486, 236, 72, true);
    this.label('FriendsShare', '邀请好友', 28, 132, -486, 236, 72, true);
    this.back = this.label('FriendsBack', '返回首页', 23, 0, -585, 500, 58, true);
    // Retain origin information for navigation diagnostics; there is no footer control.
    this.back.node.active = false;
    this.label('FriendsRules', '', 23, 0, -537, 540, 36).node.active = false;
    this.layout();
    this.root.active = false;
  }
  setArt(key: string, frame: SpriteFrame) { this.skin.setArt(key, frame); }
  destroy() { this.skin.destroy(); }
  get open() { return this.root.active; }
  get scaleValue() { return this.scale; }
  feedbackBox(action: MenuAction): HitBox | undefined { return action === 'friends-close' ? this.closeButton : this.buttons[action as keyof typeof this.buttons]; }
  show(available: boolean, score: number, fromResult: boolean, fromPaused = false) {
    this.root.active = true; this.noticeTimer = 0; this.privacy = false;
    this.notice.string = ''; this.notice.node.active = false;
    this.back.string = fromPaused ? '返回设置' : fromResult ? '返回成绩单' : '返回首页';
    this.fallbackTitle.string = ''; this.fallbackTitle.node.active = false;
    this.body.string = '暂无好友积分排名';
    this.setAvailability(available, score);
  }
  showPrivacy(pending: boolean, score: number) {
    this.privacy = true;
    this.noticeTimer = 0; this.notice.string = ''; this.notice.node.active = false;
    this.setAvailability(false, score);
    this.fallbackTitle.node.active = false;
    this.body.string = pending ? '请确认微信隐私授权。' : '未授权，点“刷新榜单”重试。';
  }
  setAvailability(available: boolean, score: number) {
    const changed = this.available !== available;
    this.available = available; this.dataViewport.active = this.dataRoot.active = available; this.fallback.active = !available;
    this.own.string = score > 0 ? `个人最高分\n${score.toLocaleString('en-US')} 分` : '个人最高分\n暂无纪录';
    if (available && !this.shared) {
      this.shared = this.dataSurface.addComponent(SubContextView);
      // Configure before onLoad initializes the shared canvas and its texture.
      this.shared.designResolutionSize.set(640, 1280);
      this.shared.fps = 12; this.dataSurface.active = true;
    }
    this.layout();
    if (changed) this.scroll.scrollToTop(0);
  }
  hide() { this.root.active = false; }
  inform(text: string) { this.notice.string = text; this.notice.node.active = !!text; this.noticeTimer = 3; }
  advance(dt: number) {
    if (!this.open || this.noticeTimer <= 0) return;
    this.noticeTimer = Math.max(0, this.noticeTimer - dt);
    if (this.noticeTimer === 0) { this.notice.string = ''; this.notice.node.active = false; }
  }
  resize(height: number, usable = height, center = 0, minimumTouch = 96) {
    this.height = height; this.usableHeight = usable; this.center = center; this.minimumTouch = minimumTouch;
    this.layout();
    const g = this.backdrop; g.clear(); g.fillColor = new Color(31, 21, 40, 224);
    g.rect(-DESIGN_WIDTH / 2, -height / 2, DESIGN_WIDTH, height); g.fill();
  }
  actionAt(point: Point): MenuAction | null {
    const x = (point.x - DESIGN_WIDTH / 2) / this.scale, y = (point.y - this.height / 2 - this.center) / this.scale;
    const close = this.closeButton;
    if (officeContains(close, x, y, this.minimumTouch / this.scale)) return 'friends-close';
    for (const [action, box] of Object.entries(this.buttons))
      if (officeContains(box, x, y, this.minimumTouch / this.scale)) return action as MenuAction;
    return null;
  }
  private layout() {
    this.scroll.stopAutoScroll();
    this.scale = Math.min(1, (DESIGN_WIDTH - 56) / 660);
    const h = this.panelHeight = Math.min(this.available ? 1280 : 760, (this.usableHeight - 96) / this.scale);
    this.card.setScale(this.scale, this.scale); this.card.setPosition(0, this.center);
    this.skin.size(this.panel, 636, h);
    const move = (name: string, y: number) => { const n = this.card.getChildByName(name)!; n.setPosition(n.position.x, y); };
    this.closeButton.y = h / 2 - 112;
    move('FriendsTitle', h / 2 - 112); move('FriendsSubtitle', h / 2 - 168);
    this.buttons['friends-refresh'].y = this.buttons['friends-share'].y = -h / 2 + 100;
    this.buttons['friends-refresh'].height = this.buttons['friends-share'].height = 88;
    move('FriendsRefresh', -h / 2 + 100); move('FriendsShare', -h / 2 + 100);
    move('FriendsNotice', -h / 2 + 184);
    this.body.node.setPosition(0, 54);
    this.fallbackTitle.node.setPosition(0, 138);
    this.own.node.setPosition(0, -h / 2 + 282);
    this.ownPaper.clear(); officeRow(this.ownPaper, { x: 0, y: -h / 2 + 282, width: 508, height: 112 });
    this.paper.clear(); officeClose(this.paper, this.closeButton);
    Object.values(this.buttons).forEach(b => officeButton(this.paper, b, 'cream'));
    const viewHeight = h - 440;
    this.dataViewport.getComponent(UITransform)!.setContentSize(540, viewHeight);
    this.dataViewport.setPosition(0, 0);
    this.dataRoot.getComponent(UITransform)!.setContentSize(520, 1040);
    this.dataRoot.setPosition(0, viewHeight / 2);
    this.scroll.scrollToTop(0);
  }
  private graphics(name: string, parent: Node) {
    const node = new Node(name); parent.addChild(node); node.addComponent(UITransform).setContentSize(720, 1600);
    return node.addComponent(Graphics);
  }
  private label(name: string, text: string, size: number, x: number, y: number, width: number, height: number, bold = false, parent = this.card) {
    const node = new Node(name); parent.addChild(node); node.addComponent(UITransform).setContentSize(width, height); node.setPosition(x, y);
    const label = node.addComponent(Label); label.string = text; label.fontSize = size; label.lineHeight = size + 7;
    label.color = INK.clone(); label.isBold = bold; label.horizontalAlign = Label.HorizontalAlign.CENTER;
    label.verticalAlign = Label.VerticalAlign.CENTER; label.overflow = Label.Overflow.SHRINK;
    return label;
  }
}
