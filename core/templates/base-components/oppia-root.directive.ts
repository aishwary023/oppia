// Copyright 2020 The Oppia Authors. All Rights Reserved.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS-IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

/**
 * @fileoverview The root directive of the oppia ajs application.
 */

// In case of doubts over what is done here, please look at the description of
// the PR #9479. https://github.com/oppia/oppia/pull/9479#issue-432536289
import { OppiaAngularRootComponent } from
  'components/oppia-angular-root.component';
import { angularServices } from 'services/angular-services.index';
import { I18nLanguageCodeService } from 'services/i18n-language-code.service';

angular.module('oppia').directive('oppiaRoot', [
  '$translate', function($translate) {
    return {
      template: require('./oppia-root.directive.html'),
      scope: {},
      transclude: true,
      controllerAs: '$ctrl',
      controller: ['$scope',
        function($scope) {
          $scope.initialized = false;

          $scope.onInit = function() {
            const map: Record<string, unknown[]> = {};
            for (let [serviceName, serviceType] of angularServices) {
              map[serviceName] = [serviceType];
            }
            const servicesToProvide = [
              'AlertsService', 'AngularNameService',
              'AnswerClassificationService',
              'AnswerGroupObjectFactory',
              'AssetsBackendApiService',
              'AudioPreloaderService', 'AudioTranslationLanguageService',
              'AudioTranslationManagerService',
              'AutogeneratedAudioPlayerService',
              'BackgroundMaskService', 'BottomNavbarStatusService',
              'BrowserCheckerService',
              'ClassroomBackendApiService', 'CodeReplRulesService',
              'CollectionCreationBackendService', 'ComputeGraphService',
              'ConceptCardObjectFactory',
              'CreatorDashboardBackendApiService',
              'CurrentInteractionService', 'DateTimeFormatService',
              'DebouncerService',
              'DeviceInfoService', 'DocumentAttributeCustomizationService',
              'EditabilityService', 'EditorFirstTimeEventsService',
              'ExplorationFeaturesService', 'ExplorationHtmlFormatterService',
              'ExplorationImprovementsBackendApiService',
              'ExplorationObjectFactory',
              'ExplorationRecommendationsService', 'ExpressionEvaluatorService',
              'ExpressionParserService', 'ExpressionSyntaxTreeService',
              'ExtensionTagAssemblerService',
              'ExtractImageFilenamesFromStateService',
              'FeedbackThreadObjectFactory',
              'FocusManagerService', 'GuestCollectionProgressService',
              'HtmlEscaperService', 'I18nLanguageCodeService',
              'IdGenerationService',
              'ImprovementsService',
              'InteractionObjectFactory', 'InteractionRulesRegistryService',
              'LanguageUtilService', 'LearnerAnswerDetailsBackendApiService',
              'LearnerDashboardBackendApiService', 'LearnerParamsService',
              'LoaderService', 'LocalStorageService', 'LoggerService',
              'LostChangeObjectFactory', 'MessengerService',
              'MetaTagCustomizationService', 'NormalizeWhitespacePipe',
              'NormalizeWhitespacePunctuationAndCasePipe',
              'NumberAttemptsService',
              'PageTitleService', 'ParamChangesObjectFactory',
              'ParamSpecsObjectFactory',
              'PencilCodeEditorRulesService',
              'PlayerCorrectnessFeedbackEnabledService',
              'PlaythroughIssuesBackendApiService',
              'PredictionAlgorithmRegistryService',
              'PretestQuestionBackendApiService',
              'ProfilePageBackendApiService', 'QuestionBackendApiService',
              'RatingComputationService',
              'ReviewTestBackendApiService',
              'SchemaDefaultValueService',
              'SchemaUndefinedLastElementService', 'SidebarStatusService',
              'SiteAnalyticsService', 'SkillObjectFactory',
              'SolutionObjectFactory',
              'SpeechSynthesisChunkerService',
              'StateCardObjectFactory', 'StateClassifierMappingService',
              'StateInteractionStatsService',
              'StateObjectFactory', 'StateTopAnswersStatsBackendApiService',
              'StateTopAnswersStatsService', 'StatesObjectFactory',
              'StoryContentsObjectFactory',
              'StoryObjectFactory',
              'StoryViewerBackendApiService',
              'SubtopicViewerBackendApiService',
              'SuggestionThreadObjectFactory',
              'SuggestionsService', 'TextInputRulesService',
              'ThreadStatusDisplayService', 'TopicObjectFactory',
              'TopicViewerBackendApiService',
              'TranslationLanguageService', 'UrlInterpolationService',
              'UrlService',
              'UserExplorationPermissionsService',
              'UtilsService', 'ValidatorsService', 'WindowDimensionsService',
              'WindowRef',
            ];
            for (let serviceName of servicesToProvide) {
              OppiaAngularRootComponent.ajsValueProvider(
                serviceName,
                OppiaAngularRootComponent.injector.get(
                  map[serviceName][0])
              );
            }

            // TODO(#12793): Remove the use of (
            // OppiaAngularRootComponent.ajsTranslate).
            OppiaAngularRootComponent.ajsTranslate = $translate;
            const translateService = (
              OppiaAngularRootComponent.translateService);
            const i18nLanguageCodeService = (
              OppiaAngularRootComponent.i18nLanguageCodeService);
            translateService.use(
              i18nLanguageCodeService.getCurrentI18nLanguageCode());
            i18nLanguageCodeService.onI18nLanguageCodeChange.subscribe(
              (code) => translateService.use(code)
            );
            i18nLanguageCodeService.setI18nLanguageCode(
              $translate.proposedLanguage() || $translate.use());

            I18nLanguageCodeService.languageCodeChangeEventEmitter
              .subscribe((code) => {
                $translate.use(code);
              });

            // The next line allows the transcluded content to start executing.
            $scope.initialized = true;
          };
        }]
    };
  }
]);
